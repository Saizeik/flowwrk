import { addDays } from "date-fns";

/** =========================
 * Reminders API (Supabase)
 * ========================= */

export const remindersApi = {
  // ...keep your existing getByApp/create/delete/complete...

  getUpcomingRange: async (fromISO: string, toISO: string) => {
    const userId = await requireUserId();
    const { data, error } = await supabase
      .from("reminders")
      .select("*")
      .eq("user_id", userId)
      .gte("remind_at", fromISO)
      .lte("remind_at", toISO)
      .order("remind_at", { ascending: true });
  
    if (error) throw error;
    return { data: (data ?? []).map(mapReminderRow) };
  },
}  
