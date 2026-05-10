/**
 * Built-in document templates for Lumina Docs.
 * Each template is a full Tiptap JSON document
 * (`{ type: 'doc', content: [...] }`) ready to drop into the editor or
 * persist to the docs.content jsonb column.
 */

export interface DocTemplate {
  id: string;
  title: string;
  icon: string;
  description: string;
  content: Record<string, unknown>;
}

type Node = Record<string, unknown>;

function heading(text: string, level: 1 | 2 | 3 = 2): Node {
  return {
    type: 'heading',
    attrs: { level },
    content: [{ type: 'text', text }],
  };
}

function paragraph(text: string): Node {
  return text
    ? { type: 'paragraph', content: [{ type: 'text', text }] }
    : { type: 'paragraph' };
}

function bulletList(items: string[]): Node {
  return {
    type: 'bulletList',
    content: items.map((text) => ({
      type: 'listItem',
      content: [
        text
          ? { type: 'paragraph', content: [{ type: 'text', text }] }
          : { type: 'paragraph' },
      ],
    })),
  };
}

function doc(...nodes: Node[]): Record<string, unknown> {
  return { type: 'doc', content: nodes };
}

export const TEMPLATES: DocTemplate[] = [
  {
    id: 'meeting-notes',
    title: 'Meeting Notes',
    icon: '📋',
    description: 'Capture decisions and action items',
    content: doc(
      heading('Meeting Notes', 1),
      heading('Attendees'),
      paragraph(''),
      heading('Agenda'),
      bulletList(['Topic 1', 'Topic 2']),
      heading('Discussion'),
      paragraph(''),
      heading('Action Items'),
      bulletList(['[ ] Action item 1 — Owner', '[ ] Action item 2 — Owner']),
      heading('Next Steps'),
      paragraph(''),
    ),
  },
  {
    id: 'project-brief',
    title: 'Project Brief',
    icon: '📊',
    description: 'Define scope, goals, and timeline',
    content: doc(
      heading('Project Brief', 1),
      heading('Overview'),
      paragraph('Brief description of the project and its purpose.'),
      heading('Objectives'),
      bulletList(['Objective 1', 'Objective 2']),
      heading('Scope'),
      paragraph('What is included and excluded.'),
      heading('Timeline'),
      paragraph('Key milestones and deadlines.'),
      heading('Resources'),
      paragraph('Team members, tools, budget.'),
      heading('Risks'),
      bulletList(['Risk 1 — Mitigation']),
    ),
  },
  {
    id: 'weekly-review',
    title: 'Weekly Review',
    icon: '✅',
    description: 'Reflect on progress and plan ahead',
    content: doc(
      heading('Weekly Review', 1),
      heading('What went well'),
      bulletList(['']),
      heading("What didn't go well"),
      bulletList(['']),
      heading('Key metrics'),
      paragraph('Tasks completed: —'),
      paragraph('Focus time: —'),
      paragraph('Events attended: —'),
      heading('Goals for next week'),
      bulletList(['Goal 1', 'Goal 2']),
    ),
  },
  {
    id: 'goal-setting',
    title: 'Goal Setting',
    icon: '🎯',
    description: 'Define goals and key results',
    content: doc(
      heading('Goal Setting', 1),
      heading('Goal'),
      paragraph('What do you want to achieve?'),
      heading('Why it matters'),
      paragraph(''),
      heading('Key Results'),
      bulletList(['KR 1: ', 'KR 2: ', 'KR 3: ']),
      heading('Milestones'),
      bulletList(['Milestone 1 — Date', 'Milestone 2 — Date']),
      heading('Resources needed'),
      paragraph(''),
    ),
  },
  {
    id: 'daily-journal',
    title: 'Daily Journal',
    icon: '📝',
    description: 'Daily reflection and priorities',
    content: doc(
      heading('Daily Journal', 1),
      heading('Gratitude'),
      bulletList(['']),
      heading("Today's priorities"),
      bulletList(['Priority 1', 'Priority 2', 'Priority 3']),
      heading('Reflections'),
      paragraph(''),
      heading("Tomorrow's focus"),
      paragraph(''),
    ),
  },
  {
    id: 'sop',
    title: 'SOP / Process Guide',
    icon: '📖',
    description: 'Document a standard operating procedure',
    content: doc(
      heading('SOP: [Process Name]', 1),
      heading('Purpose'),
      paragraph('Why this process exists.'),
      heading('Scope'),
      paragraph('When and where this applies.'),
      heading('Prerequisites'),
      bulletList(['Prerequisite 1']),
      heading('Steps'),
      bulletList(['Step 1: ', 'Step 2: ', 'Step 3: ']),
      heading('Troubleshooting'),
      bulletList(['Issue → Solution']),
    ),
  },
];

export function getTemplateById(id: string): DocTemplate | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
