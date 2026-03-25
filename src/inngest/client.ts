import { Inngest } from "inngest";

// Inngest client singleton
// Set INNGEST_EVENT_KEY from your Inngest dashboard or leave blank for local dev
export const inngest = new Inngest({
  id: "valtek-warehouse",
  name: "Valtek Warehouse SaaS",
});
