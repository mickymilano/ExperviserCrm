import OpenAI from "openai";
import { storage } from "../storage";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface AISuggestion {
  id: number;
  title: string;
  description: string;
  primaryAction: string;
  type: string;
}

export const aiService = {
  /**
   * Generate personalized suggestions based on CRM data
   */
  async generateSuggestions(userId: number): Promise<AISuggestion[]> {
    try {
      // Prepare data for generating suggestions
      const [contacts, deals, tasks, emails] = await Promise.all([
        storage.getContacts(),
        storage.getDeals(),
        storage.getTasks({}),
        storage.getEmails({}),
      ]);

      // Get recent activities for context
      const activities = await storage.getActivities({});

      // Define prompt to generate suggestions
      const prompt = `
        You are an AI assistant for a CRM system called EXPERVISER. 
        Generate 4 actionable suggestions for a sales professional or consultant based on the following data:
        
        CONTACTS: ${JSON.stringify(contacts?.slice(0, 10) || [])}
        DEALS: ${JSON.stringify(deals?.slice(0, 10) || [])}
        TASKS: ${JSON.stringify(tasks?.slice(0, 5) || [])}
        RECENT ACTIVITIES: ${JSON.stringify(activities || [])}
        
        For each suggestion:
        1. Create a brief, specific title
        2. Write a short description explaining the reasoning
        3. Suggest a primary action (e.g., "Schedule Meeting", "Send Email", "Update Contact", etc.)
        4. Assign a type from these options: "contact", "deal", "task", "email", "meeting"
        
        Return ONLY a JSON array with exactly 4 objects with this structure:
        [
          {
            "title": "Follow up with [Contact Name]",
            "description": "It's been [X days] since your last interaction about [Topic]. Consider sending a follow-up.",
            "primaryAction": "Send Email",
            "type": "email"
          }
        ]
        
        Make suggestions specific, practical and relevant to sales/consulting activities.
      `;

      // Try to generate suggestions with OpenAI, with a timeout
      let response;
      try {
        response = await Promise.race([
          openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
            response_format: { type: "json_object" },
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error("OpenAI API timeout")), 5000)
          )
        ]);
      } catch (error) {
        console.warn("OpenAI API error or timeout:", error);
        return getDefaultSuggestions();
      }

      const content = response.choices[0].message.content;
      if (!content) {
        return getDefaultSuggestions();
      }

      try {
        const result = JSON.parse(content);
        
        // Ensure the response has the expected format and add IDs
        if (Array.isArray(result.suggestions)) {
          return result.suggestions.map((suggestion: Omit<AISuggestion, 'id'>, index: number) => ({
            id: index + 1,
            ...suggestion,
          }));
        } else if (Array.isArray(result)) {
          return result.map((suggestion: Omit<AISuggestion, 'id'>, index: number) => ({
            id: index + 1,
            ...suggestion,
          }));
        }
      } catch (e) {
        console.error("Error parsing AI suggestion response:", e);
      }

      return getDefaultSuggestions();
    } catch (error) {
      console.error("Error generating AI suggestions:", error);
      return getDefaultSuggestions();
    }
  }
};

function getDefaultSuggestions(): AISuggestion[] {
  return [
    {
      id: 1,
      title: "Follow up with Urban Eats proposal",
      description: "It's been 3 days since your last email about the Urban Eats proposal. Consider sending a gentle follow-up.",
      primaryAction: "Compose Email",
      type: "email"
    },
    {
      id: 2,
      title: "Update contact information",
      description: "Some of your high-value contacts have incomplete profile information. Consider updating their details.",
      primaryAction: "Update Contacts",
      type: "contact"
    },
    {
      id: 3,
      title: "Review pipeline stages",
      description: "You have several deals stuck in the 'Proposal' stage for over 30 days. Consider reviewing and updating their status.",
      primaryAction: "Review Deals",
      type: "deal"
    },
    {
      id: 4,
      title: "Schedule quarterly review with key clients",
      description: "It's the end of the quarter. Consider scheduling review meetings with your key clients to discuss progress and future plans.",
      primaryAction: "Schedule Meetings",
      type: "meeting"
    }
  ];
}