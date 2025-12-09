import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET() {
    try {
        console.log('Fetching schedule...');
        console.log('Cookie present:', !!process.env.NI_COLLABO_COOKIE);

        const response = await fetch('http://10.1.27.101/ni/niware/schedule/', {
            cache: 'no-store',
            headers: {
                'Cookie': process.env.NI_COLLABO_COOKIE || '',
            },
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: 'Failed to fetch schedule page' },
                { status: response.status }
            );
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // scriptタグの中から scls["noportal"].scevdata を探す
        let scriptContent = '';
        $('script').each((_, element) => {
            const content = $(element).html();
            if (content && content.includes('scls["noportal"].scevdata')) {
                scriptContent = content;
                return false; // break loop
            }
        });

        if (!scriptContent) {
            const title = $('title').text() || 'No title';
            return NextResponse.json(
                { error: `Schedule data script not found. Page title: ${title}` },
                { status: 500 }
            );
        }

        // JSON部分を抽出する正規表現
        const match = scriptContent.match(/scls\["noportal"\]\.scevdata\s*=\s*({[\s\S]*?});/);

        if (!match || !match[1]) {
            return NextResponse.json(
                { error: 'Failed to parse schedule JSON' },
                { status: 500 }
            );
        }

        const jsonString = match[1];
        let scheduleData;
        try {
            scheduleData = JSON.parse(jsonString);
        } catch (e) {
            console.error('JSON Parse Error:', e);
            return NextResponse.json(
                { error: 'Invalid JSON format in schedule data' },
                { status: 500 }
            );
        }

        const events = Object.values(scheduleData).map((item: any) => {
            const tooltipHtml = item.tooltip;
            const $tooltip = cheerio.load(tooltipHtml);

            const title = $tooltip('.cuiTtipTitle').text().trim();
            const datetimeRaw = $tooltip('.cuiTtipDatetime').text().trim();
            const place = $tooltip('.cuiTtipPlaceBox').text().trim();

            const dateMatch = datetimeRaw.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
            const timeMatch = datetimeRaw.match(/(\d{1,2}):(\d{2})～(\d{1,2}):(\d{2})/);

            let start = new Date().toISOString();
            let end = new Date().toISOString();
            let isAllDay = datetimeRaw.includes('終日');

            if (dateMatch) {
                const year = parseInt(dateMatch[1]);
                const month = parseInt(dateMatch[2]) - 1;
                const day = parseInt(dateMatch[3]);

                if (timeMatch) {
                    const startHour = parseInt(timeMatch[1]);
                    const startMinute = parseInt(timeMatch[2]);
                    const endHour = parseInt(timeMatch[3]);
                    const endMinute = parseInt(timeMatch[4]);

                    start = new Date(year, month, day, startHour, startMinute).toISOString();
                    end = new Date(year, month, day, endHour, endMinute).toISOString();
                } else {
                    start = new Date(year, month, day, 9, 0).toISOString();
                    end = new Date(year, month, day, 18, 0).toISOString();
                    isAllDay = true;
                }
            }

            return {
                id: Math.random().toString(36).substring(7),
                title: title,
                start: start,
                end: end,
                location: place || undefined,
                description: datetimeRaw,
                isAllDay: isAllDay,
                color: '#22c55e', // NI Collabo events in green
            };
        });

        return NextResponse.json({ events });

    } catch (error) {
        console.error('Scraping Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
