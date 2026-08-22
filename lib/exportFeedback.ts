import ExcelJS from 'exceljs';
import { RATING_QUESTIONS, OPEN_QUESTIONS } from '@/constants/feedback';

type FeedbackDoc = {
  id: string;
  submittedAt?: { toDate: () => Date };
  timestamp?: { toDate: () => Date };
  ratings?: Record<string, number>;
  rating?: number;
  likedMost?: string;
  improvements?: string;
  suggestions?: string;
  comment?: string;
  eventId?: string;
};

function formatSubmittedAt(doc: FeedbackDoc): string {
  const ts = doc.submittedAt ?? doc.timestamp;
  if (ts?.toDate) return ts.toDate().toLocaleString();
  return '';
}

function getOverallRating(doc: FeedbackDoc): number {
  if (doc.ratings?.overall) return doc.ratings.overall;
  return doc.rating ?? 0;
}

export function feedbackToExportRows(
  feedbacks: FeedbackDoc[],
  eventTitleById: Record<string, string>
) {
  const headers = [
    'Submitted At',
    'Event',
    ...RATING_QUESTIONS.map((q) => q.label),
    ...OPEN_QUESTIONS.map((q) => q.label),
  ];

  const rows = feedbacks.map((f) => {
    const ratings = f.ratings ?? {};
    const legacyOverall = f.rating;
    return [
      formatSubmittedAt(f),
      f.eventId ? eventTitleById[f.eventId] ?? f.eventId : 'General',
      ratings.overall ?? legacyOverall ?? '',
      ratings.engaging ?? '',
      ratings.relevant ?? '',
      ratings.duration ?? '',
      ratings.venue ?? '',
      f.likedMost ?? (f.comment && !f.ratings ? f.comment : '') ?? '',
      f.improvements ?? '',
      f.suggestions ?? '',
    ];
  });

  return { headers, rows };
}

export async function downloadFeedbackExcel(
  feedbacks: FeedbackDoc[],
  eventTitleById: Record<string, string>,
  filenamePrefix = 'feedback'
) {
  const { headers, rows } = feedbackToExportRows(feedbacks, eventTitleById);

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Feedback');

  worksheet.addRow(headers);
  rows.forEach((row) => worksheet.addRow(row));

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `${filenamePrefix}_${date}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

export function getDisplayRating(doc: FeedbackDoc): number {
  return getOverallRating(doc);
}

export function getOpenEndedEntries(doc: FeedbackDoc): { label: string; text: string }[] {
  const entries: { label: string; text: string }[] = [];
  if (doc.likedMost?.trim()) {
    entries.push({ label: 'Liked most', text: doc.likedMost.trim() });
  }
  if (doc.improvements?.trim()) {
    entries.push({ label: 'Improvements', text: doc.improvements.trim() });
  }
  if (doc.suggestions?.trim()) {
    entries.push({ label: 'Suggestions', text: doc.suggestions.trim() });
  }
  if (doc.comment?.trim() && !doc.suggestions) {
    entries.push({ label: 'Comment', text: doc.comment.trim() });
  }
  return entries;
}
