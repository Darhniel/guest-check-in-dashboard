/**
 * Guest-list CSV reader.
 *
 * Parses spreadsheets exported from Excel / Google Sheets into the same
 * `guests` payload the organizer bulk endpoint accepts. Kept free of DOM and
 * React imports so it can be exercised directly in tests.
 */

export type GuestField =
    | 'names'
    | 'email'
    | 'phone'
    | 'category_name'
    | 'kids'
    | 'kid_name'
    | 'kid_age'
    | 'kid_gender';

export interface KidInput {
    name: string;
    age: number;
    gender: string;
}

export interface GuestPayload {
    names: string;
    email: string;
    phone: string;
    category_name: string;
    kids: KidInput[];
}

export interface GuestImportRow {
    /** 1-based line in the file, so messages point at what the user sees. */
    rowNumber: number;
    payload: GuestPayload;
    warnings: string[];
}

export interface GuestImportPlan {
    rows: GuestImportRow[];
    skipped: { rowNumber: number; reason: string }[];
    mapped: Partial<Record<GuestField, number>>;
    unknownHeaders: string[];
    totalRows: number;
}

export interface ParsedGuestCsv {
    encoding: 'utf-8' | 'windows-1252';
    delimiter: string;
    headers: string[];
    plan: GuestImportPlan;
}

export const GUEST_FIELD_LABELS: Record<GuestField, string> = {
    names: 'Guest name',
    email: 'Email',
    phone: 'Phone',
    category_name: 'Category',
    kids: 'Kids',
    kid_name: 'Kid name',
    kid_age: 'Kid age',
    kid_gender: 'Kid gender',
};

/**
 * Header aliases, ordered from most to least specific. Matching is exact on a
 * normalised header first, then falls back to "contains".
 */
const FIELD_ALIASES: Record<GuestField, string[]> = {
    kids: ['kids', 'children', 'kids names', 'children names', 'kids details', 'children details'],
    kid_name: ['kid name', 'child name', 'kid', 'child'],
    kid_age: ['kid age', 'child age'],
    kid_gender: ['kid gender', 'child gender', 'kid sex', 'child sex'],
    category_name: [
        'category',
        'category name',
        'guest category',
        'ticket category',
        'ticket type',
        'ticket class',
        'class',
        'type',
    ],
    email: ['email', 'e mail', 'email address', 'mail'],
    phone: [
        'phone',
        'phone number',
        'phone no',
        'mobile',
        'mobile number',
        'telephone',
        'tel',
        'whatsapp',
        'whatsapp number',
        'contact',
        'contact number',
    ],
    names: [
        'names',
        'adult names',
        'adult name',
        'guest names',
        'guest name',
        'attendee name',
        'attendee',
        'full name',
        'fullname',
        'customer name',
        'client name',
        'name',
        'guest',
    ],
};

const FIELD_ORDER: GuestField[] = [
    'kids',
    'kid_name',
    'kid_age',
    'kid_gender',
    'category_name',
    'email',
    'phone',
    'names',
];

const DELIMITERS = [',', ';', '\t'];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const GUEST_CSV_HEADERS = [
    'names',
    'email',
    'phone',
    'category_name',
    'kids',
];

export const GUEST_CSV_ROWS = [
    [
        'Ada Obi',
        'ada.obi@example.com',
        '+234 801 234 5678',
        'VIP',
        'Tobi Obi (6)',
    ],
    [
        'Chinedu Eze',
        'chinedu.eze@example.com',
        '+234 802 345 6789',
        'Regular',
        '',
    ],
    ['Ngozi Bello', '', '+234 803 456 7890', 'VIP', 'Ada Bello (4, F)'],
];

/** CSV string with a header row and a few example guests. */
export const GUEST_CSV_TEMPLATE = [
    GUEST_CSV_HEADERS.join(','),
    ...GUEST_CSV_ROWS.map((row) =>
        row.map((cell) => (cell.includes(',') ? `"${cell}"` : cell)).join(',')
    ),
].join('\n');

function normaliseHeader(value: string) {
    return value
        .replace(/^\ufeff/, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

/**
 * Decodes CSV bytes. Spreadsheet exports are not always UTF-8: Excel on
 * Windows still writes ANSI (cp1252) by default, so fall back to that rather
 * than filling names with replacement characters.
 */
export function decodeCsv(buffer: ArrayBuffer): {
    text: string;
    encoding: 'utf-8' | 'windows-1252';
} {
    try {
        return {
            text: new TextDecoder('utf-8', { fatal: true }).decode(buffer),
            encoding: 'utf-8',
        };
    } catch {
        return {
            text: new TextDecoder('windows-1252').decode(buffer),
            encoding: 'windows-1252',
        };
    }
}

function countOutsideQuotes(line: string, delimiter: string) {
    let count = 0;
    let quoted = false;
    for (let i = 0; i < line.length; i += 1) {
        const char = line[i];
        if (char === '"') quoted = !quoted;
        else if (char === delimiter && !quoted) count += 1;
    }
    return count;
}

function detectDelimiter(text: string) {
    const firstLine = text.split('\n').find((line) => line.trim() !== '') ?? '';
    let best = ',';
    let bestScore = -1;

    for (const delimiter of DELIMITERS) {
        const score = countOutsideQuotes(firstLine, delimiter);
        if (score > bestScore) {
            best = delimiter;
            bestScore = score;
        }
    }

    return best;
}

export interface CsvTable {
    headers: string[];
    rows: string[][];
    delimiter: string;
}

export function parseCsv(text: string, delimiter?: string): CsvTable {
    const source = text.replace(/\r\n?/g, '\n');
    const separator = delimiter ?? detectDelimiter(source);
    const records: string[][] = [];

    let row: string[] = [];
    let field = '';
    let quoted = false;

    for (let i = 0; i < source.length; i += 1) {
        const char = source[i];

        if (quoted) {
            if (char === '"') {
                if (source[i + 1] === '"') {
                    field += '"';
                    i += 1;
                } else {
                    quoted = false;
                }
            } else {
                field += char;
            }
            continue;
        }

        if (char === '"') {
            quoted = true;
        } else if (char === separator) {
            row.push(field);
            field = '';
        } else if (char === '\n') {
            row.push(field);
            records.push(row);
            row = [];
            field = '';
        } else {
            field += char;
        }
    }

    if (field !== '' || row.length > 0) {
        row.push(field);
        records.push(row);
    }

    // Drop blank lines, including a trailing one at EOF.
    const filled = records.filter((cells) =>
        cells.some((cell) => cell.trim() !== '')
    );

    const [headerRow = [], ...body] = filled;

    return {
        headers: headerRow.map((header) => header.trim()),
        rows: body,
        delimiter: separator,
    };
}

export function mapHeaders(headers: string[]): Partial<Record<GuestField, number>> {
    const normalised = headers.map(normaliseHeader);
    const mapped: Partial<Record<GuestField, number>> = {};
    const available = new Set(normalised.map((_, index) => index));

    // Exact matches first so "kid name" never satisfies "name".
    for (const field of FIELD_ORDER) {
        const index = normalised.findIndex(
            (header, position) =>
                available.has(position) && FIELD_ALIASES[field].includes(header)
        );
        if (index !== -1) {
            mapped[field] = index;
            available.delete(index);
        }
    }

    // Then a looser pass, e.g. "Guest Full Name (as on ticket)".
    for (const field of FIELD_ORDER) {
        if (mapped[field] !== undefined) continue;
        const index = [...available].find((position) =>
            FIELD_ALIASES[field].some((alias) =>
                normalised[position].includes(alias)
            )
        );
        if (index !== undefined) {
            mapped[field] = index;
            available.delete(index);
        }
    }

    return mapped;
}

function cell(row: string[], index: number | undefined) {
    if (index === undefined) return '';
    return (row[index] ?? '').trim();
}

function parseKid(part: string): KidInput | null {
    const parenthesised = part.match(
        /^(.*?)\s*\((\d{1,2})(?:\s*[,:]\s*([A-Za-z]+))?\)$/
    );
    if (parenthesised) {
        const name = parenthesised[1].trim();
        if (!name) return null;
        return {
            name,
            age: Number(parenthesised[2]),
            gender: (parenthesised[3] ?? '').trim(),
        };
    }

    const bits = part
        .split(/[:,]/)
        .map((bit) => bit.trim())
        .filter(Boolean);
    const ageIndex = bits.findIndex(
        (bit, index) => index > 0 && /^\d{1,2}$/.test(bit)
    );
    if (ageIndex === -1) return null;

    const name = bits.slice(0, ageIndex).join(' ').trim();
    if (!name) return null;

    return {
        name,
        age: Number(bits[ageIndex]),
        gender: bits[ageIndex + 1] ?? '',
    };
}

/** `Tobi Obi (6); Ada Obi (4, F)` or `Tobi Obi:6:M | Ada Obi:4` */
export function parseKidsCell(value: string): KidInput[] {
    return value
        .split(/[;|]/)
        .map((part) => part.trim())
        .filter(Boolean)
        .map(parseKid)
        .filter((kid): kid is KidInput => kid !== null);
}

export function buildGuestImportPlan(table: CsvTable): GuestImportPlan {
    const mapped = mapHeaders(table.headers);
    const usedColumns = new Set(Object.values(mapped));

    const rows: GuestImportRow[] = [];
    const skipped: { rowNumber: number; reason: string }[] = [];
    const seenEmails = new Map<string, number>();
    const seenNames = new Map<string, number>();

    table.rows.forEach((raw, index) => {
        const rowNumber = index + 2;
        const warningList: string[] = [];

        const names = cell(raw, mapped.names);
        if (!names) {
            skipped.push({ rowNumber, reason: 'Missing guest name' });
            return;
        }

        const rawEmail = cell(raw, mapped.email);
        const phone = cell(raw, mapped.phone);
        let email = rawEmail;
        if (email && !EMAIL_PATTERN.test(email)) {
            warningList.push(`Invalid email "${email}" — ignored`);
            email = '';
        }

        // A guest is only accepted with a name plus at least one contact
        // method, so the API never receives a row it would reject.
        if (!email && !phone) {
            skipped.push({
                rowNumber,
                reason: rawEmail
                    ? 'Invalid email and no phone number'
                    : 'Missing email or phone number',
            });
            return;
        }

        if (email) {
            const key = email.toLowerCase();
            const firstRow = seenEmails.get(key);
            if (firstRow) {
                warningList.push(`Duplicate of row ${firstRow}`);
            } else {
                seenEmails.set(key, rowNumber);
            }
        } else {
            const key = names.toLowerCase();
            const firstRow = seenNames.get(key);
            if (firstRow) {
                warningList.push(`Duplicate name of row ${firstRow}`);
            } else {
                seenNames.set(key, rowNumber);
            }
        }

        const kids: KidInput[] = parseKidsCell(cell(raw, mapped.kids));

        // Single-child columns, for sheets that put one kid per row.
        const kidName = cell(raw, mapped.kid_name);
        if (kidName) {
            const age = Number(cell(raw, mapped.kid_age));
            if (Number.isFinite(age) && age > 0 && age < 130) {
                kids.push({
                    name: kidName,
                    age,
                    gender: cell(raw, mapped.kid_gender),
                });
            } else {
                warningList.push(`Kid "${kidName}" has no valid age — skipped`);
            }
        }

        const kidsCell = cell(raw, mapped.kids);
        if (kidsCell && kids.length === 0) {
            warningList.push(`Could not read kids "${kidsCell}" — imported without them`);
        }

        rows.push({
            rowNumber,
            payload: {
                names,
                email,
                phone,
                category_name: cell(raw, mapped.category_name),
                kids,
            },
            warnings: warningList,
        });
    });

    const unknownHeaders = table.headers.filter(
        (header, index) =>
            header.trim() !== '' && !usedColumns.has(index)
    );

    return {
        rows,
        skipped,
        mapped,
        unknownHeaders,
        totalRows: table.rows.length,
    };
}

export function parseGuestCsv(buffer: ArrayBuffer): ParsedGuestCsv {
    const { text, encoding } = decodeCsv(buffer);
    const table = parseCsv(text);

    return {
        encoding,
        delimiter: table.delimiter,
        headers: table.headers,
        plan: buildGuestImportPlan(table),
    };
}

/** Splits rows into batches the API accepts (1000 max). */
export function chunkRows<T>(rows: T[], size: number): T[][] {
    const batches: T[][] = [];
    for (let index = 0; index < rows.length; index += size) {
        batches.push(rows.slice(index, index + size));
    }
    return batches;
}
