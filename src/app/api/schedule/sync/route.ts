
import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { ScheduleEvent, ScheduleUser } from '@/types/schedule';
import { addDays, parse, format } from 'date-fns';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { date, cookie_value } = body;

        if (!cookie_value) {
            return NextResponse.json({ error: 'Cookie is required' }, { status: 400 });
        }

        // Configure target URL (using the one provided by user)
        const baseUrl = 'http://10.1.27.101/ni/niware/schedule/index.php';
        const formattedDate = format(new Date(date), 'yyyyMMdd');

        // Using fixed params from user for now, but date is dynamic
        const params = new URLSearchParams({
            p: 'list',
            m: 'groupweekly',
            startdate: formattedDate,
            target: '235',
            target_group: '8',
            target_groups: '8',
            hkey: 'clbheader_4401e918f8b24f4aa9f564b9e5a709d6' // Keeping the provided hkey
        });

        const targetUrl = `${baseUrl}?${params.toString()}`;

        console.log(`Fetching schedule from: ${targetUrl}`);

        const response = await fetch(targetUrl, {
            headers: {
                'Cookie': `__NISID__=${cookie_value};`,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (!response.ok) {
            console.error(`Fetch failed: ${response.status} ${response.statusText}`);
            return NextResponse.json({ error: `Failed to fetch from NI Collabo: ${response.status}` }, { status: response.status });
        }

        const arrayBuffer = await response.arrayBuffer();
        // Shift_JIS produced garbage typical of UTF-8 being misread (e.g. 縺). 
        // Trying UTF-8.
        const decoder = new TextDecoder('utf-8');
        const html = decoder.decode(arrayBuffer);

        const $ = cheerio.load(html);

        const users: ScheduleUser[] = [];
        const events: ScheduleEvent[] = [];

        const pageTitle = $('title').text();
        console.log(`Page Title: ${pageTitle}`);

        // Parsing Strategy: 
        // 1. Parse Users from the table to map Row Index -> User ID
        // 2. Parse Events from the 'scls["noportal"].scevents' JavaScript object embedded in the page

        // --- Step 1: User Parsing & Alignment ---
        // The user wants to display specific members. 
        // We also need to map st-grid (which likely corresponds to "rows with checkboxes") to these users.

        const TARGET_MEMBERS = [
            "田中 優史", "須藤 浩輔", "井上 宗敬", "田中 伸尚",
            "今泉 雄妃", "原 成", "梶原 麻希", "安部 玲理", "西隈 啓二",
            "久我 愛", "松下 和央", "伊藤 敦",
            "李 英杰", "七村 優妃",
            "三嶽 悟", "大坪 隆", "玉木 陽介", "山本 健斗",
            "崎村 悠登", "副田 武司"
        ];

        // Map Names to Fixed IDs (Must match scheduleStore.ts)
        // Map Names to Fixed IDs (Shifted: Inoue=u2, TanakaN=u3, etc. Sudo removed)
        const FIXED_USER_MAP: { [key: string]: string } = {
            "田中 優史": "u1",
            "井上 宗敬": "u2", "田中 伸尚": "u3",
            "今泉 雄妃": "u4", "原 成": "u5", "梶原 麻希": "u6", "安部 玲理": "u7", "西隈 啓二": "u8",
            "久我 愛": "u9", "松下 和央": "u10", "伊藤 敦": "u11",
            "李 英杰": "u12", "七村 優妃": "u13",
            "三嶽 悟": "u14", "大坪 隆": "u15", "玉木 陽介": "u16", "山本 健斗": "u17",
            "崎村 悠登": "u18", "副田 武司": "u19"
        };

        // Normalize the map keys too
        const FIXED_ID_LOOKUP: { [key: string]: string } = {};
        Object.keys(FIXED_USER_MAP).forEach(k => {
            FIXED_ID_LOOKUP[k.replace(/\s+/g, '')] = FIXED_USER_MAP[k];
        });

        // --- Step 2: Extract Event Data (Grid) ---
        // We do this first so we have the grid ready when we iterate rows
        const scriptContent = $('script').filter((i, el) => {
            return ($(el).html() || '').includes('scls["noportal"].scevents =');
        }).html();

        let eventsData: any = null;
        if (scriptContent) {
            const startMarker = 'scls["noportal"].scevents =';
            const startIndex = scriptContent.indexOf(startMarker);
            if (startIndex !== -1) {
                let jsonStart = scriptContent.indexOf('{', startIndex);
                if (jsonStart !== -1) {
                    // Simplified extraction for speed/robustness
                    let braceCount = 0;
                    let inString = false;
                    let escape = false;
                    let jsonEnd = -1;
                    for (let i = jsonStart; i < scriptContent.length; i++) {
                        const char = scriptContent[i];
                        if (escape) { escape = false; continue; }
                        if (char === '\\') { escape = true; continue; }
                        if (char === '"' && !escape) { inString = !inString; continue; }
                        if (!inString) {
                            if (char === '{') braceCount++;
                            else if (char === '}') {
                                braceCount--;
                                if (braceCount === 0) { jsonEnd = i + 1; break; }
                            }
                        }
                    }
                    if (jsonEnd !== -1) {
                        try {
                            eventsData = JSON.parse(scriptContent.substring(jsonStart, jsonEnd));
                        } catch (e) { console.error(`JSON Parse Error: ${e}`); }
                    }
                }
            }
        }

        let gridArray: any[] = [];
        if (eventsData && Array.isArray(eventsData["st-grid"])) {
            gridArray = eventsData["st-grid"];
        }

        // --- Step 3: Find User Rows (Robust Strategy) ---
        // Strategy: Find the specific TABLE that contains the actual schedule data.
        // The most reliable heuristic is the table with the most checkboxes (one per user row).
        let targetTableRows: cheerio.Cheerio<any> | null = null;
        let maxCheckboxes = 0;

        $('table').each((i: number, table: any) => {
            const $table = $(table);
            const checkboxCount = $table.find('input[type="checkbox"]').length;

            if (checkboxCount > maxCheckboxes) {
                maxCheckboxes = checkboxCount;
                const $rows = $table.find('tr');
                // Ensure it has enough rows to be the main schedule
                if ($rows.length > 5) {
                    targetTableRows = $rows;
                }
            }
        });

        // If no table with meaningful checkboxes found, fall back to all rows (unlikely to work but safe)
        const rowsToProcess = targetTableRows || $('tr');

        // --- Step 4: Iterate & Map ---
        let gridIndex = 0;
        const debugInfo: string[] = [];
        let linkCount = 0;

        // Debugging what we found
        debugInfo.push(`Target Rows: ${rowsToProcess.length}`);

        rowsToProcess.each((i: number, row: any) => {
            const $row = $(row);

            // Skip obvious headers
            if ($row.find('th').length > 0) return;

            // Strategy: Every row with a checkbox consumes a Grid Index.
            // This is the most reliable structure in NI Collabo.
            const hasCheckbox = $row.find('input[type="checkbox"]').length > 0;

            if (hasCheckbox) {
                // This is a data row
                const myGridData = gridArray[gridIndex];
                gridIndex++;

                // Get name for mapping
                // Text might be messy " [ ] Name Dept ..."
                // We'll search the whole row text for our target names.
                const rowText = $row.text();
                const normalizedRowText = rowText.replace(/\s+/g, '');

                // Check against valid ID map
                // We check if the row CONTAINS the key
                let matchedId = null;
                let matchedName = "";

                // FIXED_ID_LOOKUP keys are normalized (no spaces)
                const lookupKeys = Object.keys(FIXED_ID_LOOKUP);
                for (const key of lookupKeys) {
                    if (normalizedRowText.includes(key)) {
                        matchedId = FIXED_ID_LOOKUP[key];
                        matchedName = key;
                        break;
                    }
                }

                if (matchedId) {
                    linkCount++;
                    const userId = matchedId;

                    // Always add the user to the list
                    users.push({
                        id: userId,
                        name: matchedName,
                        department: 'NI連携',
                        color: '#cccccc'
                    });

                    // Parse events using the data from the ALIGNED index
                    if (myGridData) {
                        Object.keys(myGridData).forEach(key => {
                            // Key format: "DayIndex-ItemIndex"
                            const parts = key.split('-');
                            if (parts.length >= 2) {
                                const dayIndex = parseInt(parts[0], 10);
                                const eventData = myGridData[key];
                                const eventHtml = eventData.html;

                                const $event = cheerio.load(eventHtml);
                                const timeText = $event('.cuiEvTime').text().trim();
                                const titleText = $event('.cuiEvTitle').text().trim() || $event('a').text().trim() || '予定あり';

                                const baseDateStr = body.date;
                                const baseDate = new Date(baseDateStr);
                                const targetDate = addDays(baseDate, dayIndex - 1);
                                const dateStr = format(targetDate, 'yyyy-MM-dd');

                                const normalizedTime = timeText.replace(/[０-９：～]/g, (s) => {
                                    const map: { [key: string]: string } = { '～': '~' };
                                    if (map[s]) return map[s];
                                    return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
                                });

                                const timeRangeMatch = normalizedTime.match(/([0-9]{1,2}:[0-9]{2})\s*[~-]\s*([0-9]{1,2}:[0-9]{2})/);
                                let startT = "09:00";
                                let endT = "10:00";

                                if (timeRangeMatch) {
                                    startT = timeRangeMatch[1];
                                    endT = timeRangeMatch[2];
                                } else {
                                    const singleTime = normalizedTime.match(/([0-9]{1,2}:[0-9]{2})/);
                                    if (singleTime) {
                                        startT = singleTime[1];
                                        endT = singleTime[1];
                                    }
                                }

                                events.push({
                                    id: eventData.ukey || `evt_${userId}_${key}`,
                                    userId: userId,
                                    title: titleText,
                                    start: parse(`${dateStr} ${startT}`, 'yyyy-MM-dd HH:mm', new Date()).toISOString(),
                                    end: parse(`${dateStr} ${endT}`, 'yyyy-MM-dd HH:mm', new Date()).toISOString(),
                                    color: '#2196f3'
                                });
                            }
                        });
                    }
                } else {
                    // Row had checkbox (consumed index) but wasn't in our target list
                    if (debugInfo.length < 10) debugInfo.push(`Skipped(Unknown): ${normalizedRowText.substring(0, 15)}...`);
                }
            }
        });

        // Debug summary
        debugInfo.push(`Checked: ${gridIndex}`);
        debugInfo.push(`Linked: ${linkCount}`);
        debugInfo.push(`Events: ${events.length}`);

        return NextResponse.json({
            success: true,
            // Friendly message
            message: `同期完了: ${events.length} 件の予定を更新しました。(Link: ${linkCount}/${TARGET_MEMBERS.length})`,
            pageTitle: pageTitle,
            users: users,
            events: events
        });

    } catch (error: any) {
        console.error('Scraping error:', error);
        return NextResponse.json({ error: `Internal Server Error: ${error.message || error}` }, { status: 500 });
    }
}
