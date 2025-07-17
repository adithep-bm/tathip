export interface Alert {
  id: string;
  type: "high" | "medium" | "low";
  title: string;
  message: string;
  timestamp: string;
  status: 'unread' | 'read' | 'resolved';
  source: string;
}