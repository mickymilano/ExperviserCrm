import { Client } from "@notionhq/client";
import type { DatabaseObjectResponse, PartialDatabaseObjectResponse } from "@notionhq/client/build/src/api-endpoints";

// Initialize Notion client
export const notion = new Client({
    auth: process.env.NOTION_INTEGRATION_SECRET!,
});

// Extract the page ID from the Notion page URL
function extractPageIdFromUrl(pageUrl: string): string {
    const match = pageUrl.match(/([a-f0-9]{32})(?:[?#]|$)/i);
    if (match && match[1]) {
        return match[1];
    }

    throw Error("Failed to extract page ID");
}

// Check if we have a NOTION_PAGE_URL defined
export const NOTION_PAGE_ID = process.env.NOTION_PAGE_URL ? 
    extractPageIdFromUrl(process.env.NOTION_PAGE_URL) : undefined;

/**
 * Lists all child databases contained within NOTION_PAGE_ID
 * @returns {Promise<Array<DatabaseObjectResponse>>} - Array of database objects
 */
export async function getNotionDatabases() {
    if (!NOTION_PAGE_ID) {
        throw new Error("NOTION_PAGE_ID non configurato. Imposta NOTION_PAGE_URL nelle variabili di ambiente.");
    }

    // Array to store the child databases
    const childDatabases: DatabaseObjectResponse[] = [];

    try {
        // Query all child blocks in the specified page
        let hasMore = true;
        let startCursor: string | undefined = undefined;

        while (hasMore) {
            const response = await notion.blocks.children.list({
                block_id: NOTION_PAGE_ID,
                start_cursor: startCursor,
            });

            // Process the results
            for (const block of response.results) {
                // Check if the block is a child database
                // Using type assertion since we know the block structure
                const blockWithType = block as any;
                if (blockWithType.type === "child_database") {
                    const databaseId = block.id;

                    // Retrieve the database title
                    try {
                        const databaseInfo = await notion.databases.retrieve({
                            database_id: databaseId,
                        });

                        // Add the database to our list
                        childDatabases.push(databaseInfo);
                    } catch (error) {
                        console.error(`Error retrieving database ${databaseId}:`, error);
                    }
                }
            }

            // Check if there are more results to fetch
            hasMore = response.has_more;
            startCursor = response.next_cursor || undefined;
        }

        return childDatabases;
    } catch (error) {
        console.error("Error listing child databases:", error);
        throw error;
    }
}

// Find a Notion database with the matching title
export async function findDatabaseByTitle(title: string): Promise<DatabaseObjectResponse | null> {
    if (!NOTION_PAGE_ID) {
        throw new Error("NOTION_PAGE_ID non configurato. Imposta NOTION_PAGE_URL nelle variabili di ambiente.");
    }

    const databases = await getNotionDatabases();

    for (const db of databases) {
        // Accessing title property safely with type assertion
        const dbProperties = db as any;
        if (dbProperties.title && Array.isArray(dbProperties.title) && dbProperties.title.length > 0) {
            const dbTitle = dbProperties.title[0]?.plain_text?.toLowerCase() || "";
            if (dbTitle === title.toLowerCase()) {
                return db;
            }
        }
    }

    return null;
}

// Create a new database if one with a matching title does not exist
export async function createDatabaseIfNotExists(
    title: string, 
    properties: Record<string, any>
): Promise<DatabaseObjectResponse> {
    if (!NOTION_PAGE_ID) {
        throw new Error("NOTION_PAGE_ID non configurato. Imposta NOTION_PAGE_URL nelle variabili di ambiente.");
    }

    const existingDb = await findDatabaseByTitle(title);
    if (existingDb) {
        return existingDb;
    }
    return await notion.databases.create({
        parent: {
            type: "page_id",
            page_id: NOTION_PAGE_ID
        },
        title: [
            {
                type: "text",
                text: {
                    content: title
                }
            }
        ],
        properties
    });
}

// Is Notion integration configured?
export function isNotionConfigured(): boolean {
    return !!process.env.NOTION_INTEGRATION_SECRET && !!process.env.NOTION_PAGE_URL;
}

// Get Notion configuration status
export function getNotionConfigStatus(): { 
    configured: boolean; 
    message: string;
    hasIntegrationSecret: boolean;
    hasPageUrl: boolean;
} {
    const hasIntegrationSecret = !!process.env.NOTION_INTEGRATION_SECRET;
    const hasPageUrl = !!process.env.NOTION_PAGE_URL;
    
    if (hasIntegrationSecret && hasPageUrl) {
        return {
            configured: true,
            message: "Integrazione Notion configurata correttamente",
            hasIntegrationSecret,
            hasPageUrl
        };
    }
    
    let message = "Integrazione Notion non configurata: ";
    if (!hasIntegrationSecret) message += "manca NOTION_INTEGRATION_SECRET ";
    if (!hasPageUrl) message += "manca NOTION_PAGE_URL";
    
    return {
        configured: false,
        message,
        hasIntegrationSecret,
        hasPageUrl
    };
}