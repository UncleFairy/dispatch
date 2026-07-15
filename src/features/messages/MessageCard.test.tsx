// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MessageCard } from '@/features/messages/MessageCard';
import { MAX_BODY, MIN_BODY, type Message } from '@/lib/schemas';

const message: Message = {
  id: 'msg_1',
  authorId: 'u_ada',
  author: { id: 'u_ada', name: 'Ada Lovelace', handle: 'ada_l', initial: 'A' },
  body: 'the original message body',
  tag: 'PRODUCT',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  edited: false,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('MessageCard — author-only actions', () => {
  it('hides Edit/Delete for messages authored by someone else', () => {
    render(<MessageCard message={message} isOwn={false} />);
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete|del/i })).not.toBeInTheDocument();
  });

  it("shows Edit/Delete for the current user's own message", () => {
    render(<MessageCard message={message} isOwn />);
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });
});

describe('MessageCard — inline edit', () => {
  it('opens the edit form pre-filled with the current body, and Cancel discards it', async () => {
    const user = userEvent.setup();
    render(<MessageCard message={message} isOwn onUpdate={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Edit' }));
    expect(screen.getByLabelText('Edit message')).toHaveValue(message.body);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByLabelText('Edit message')).not.toBeInTheDocument();
    expect(screen.getByText(message.body)).toBeInTheDocument();
  });

  it('warns instead of saving when the edited body is under the minimum length', async () => {
    const onUpdate = vi.fn();
    const user = userEvent.setup();
    render(<MessageCard message={message} isOwn onUpdate={onUpdate} />);

    await user.click(screen.getByRole('button', { name: 'Edit' }));
    const textarea = screen.getByLabelText('Edit message');
    await user.clear(textarea);
    await user.type(textarea, 'x'.repeat(MIN_BODY - 1));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      `Write at least ${MIN_BODY} characters.`,
    );
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('warns instead of saving when the edited body is over the 240-character limit', async () => {
    const onUpdate = vi.fn();
    const user = userEvent.setup();
    render(<MessageCard message={message} isOwn onUpdate={onUpdate} />);

    await user.click(screen.getByRole('button', { name: 'Edit' }));
    const textarea = screen.getByLabelText('Edit message');
    await user.clear(textarea);
    await user.click(textarea);
    await user.paste('x'.repeat(MAX_BODY + 1));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      `Keep it under ${MAX_BODY} characters.`,
    );
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('calls onUpdate with the trimmed body and tag on a valid save', async () => {
    const onUpdate = vi.fn((_input, options?: { onSuccess?: () => void }) =>
      options?.onSuccess?.(),
    );
    const user = userEvent.setup();
    render(<MessageCard message={message} isOwn onUpdate={onUpdate} />);

    await user.click(screen.getByRole('button', { name: 'Edit' }));
    const textarea = screen.getByLabelText('Edit message');
    await user.clear(textarea);
    await user.type(textarea, '  a perfectly valid updated body  ');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onUpdate).toHaveBeenCalledWith(
      { body: 'a perfectly valid updated body', tag: message.tag },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
    // onSuccess collapses the form back to read-only view.
    expect(screen.queryByLabelText('Edit message')).not.toBeInTheDocument();
  });
});

describe('MessageCard — delete confirmation', () => {
  it('requires a second click before calling onDelete', async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();
    render(<MessageCard message={message} isOwn onDelete={onDelete} />);

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await user.click(deleteButton);
    expect(onDelete).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Confirm?' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Confirm?' }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
