import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { updateExchangeRates, checkLowStockAlert } from "@/inngest/functions";

// Route: POST /api/inngest
// This registers all Inngest functions with the Inngest cloud/dev server
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [updateExchangeRates, checkLowStockAlert],
});
