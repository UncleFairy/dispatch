// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Composer } from '@/features/messages/Composer';
import { MAX_BODY, MIN_BODY, type Author } from '@/lib/schemas';

vi.mock('@/lib/api-client', () => ({
  createMessage: vi.fn(),
}));

const { createMessage } = await import('@/lib/api-client');

const currentUser: Author = {
  id: 'u_ada',
  name: 'Ada Lovelace',
  handle: 'ada_l',
  initial: 'A',
};

function renderComposer() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <Composer currentUser={currentUser} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Composer', () => {
  it('updates the character counter as the user types', async () => {
    const user = userEvent.setup();
    renderComposer();
    const textarea = screen.getByLabelText('New message');

    expect(screen.getByText(`0/${MAX_BODY}`)).toBeInTheDocument();
    await user.type(textarea, 'hello there');
    expect(screen.getByText(`11/${MAX_BODY}`)).toBeInTheDocument();
  });

  it('warns and does not submit when the body is under the minimum length', async () => {
    const user = userEvent.setup();
    renderComposer();
    await user.type(screen.getByLabelText('New message'), 'x'.repeat(MIN_BODY - 1));
    await user.click(screen.getByRole('button', { name: /post/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      `Write at least ${MIN_BODY} characters.`,
    );
    expect(createMessage).not.toHaveBeenCalled();
  });

  it('warns and does not submit when the body is over the 240-character limit', async () => {
    const user = userEvent.setup();
    renderComposer();
    const textarea = screen.getByLabelText('New message');
    await user.click(textarea);
    await user.paste('x'.repeat(MAX_BODY + 1));
    expect(screen.getByText(`${MAX_BODY + 1}/${MAX_BODY}`)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /post/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      `Keep it under ${MAX_BODY} characters.`,
    );
    expect(createMessage).not.toHaveBeenCalled();
  });

  it('posts a valid message and clears the composer on success', async () => {
    vi.mocked(createMessage).mockResolvedValue({
      id: 'msg_1',
      authorId: currentUser.id,
      author: currentUser,
      body: 'a perfectly valid message',
      tag: 'PRODUCT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      edited: false,
    });

    const user = userEvent.setup();
    renderComposer();
    const textarea = screen.getByLabelText('New message');
    await user.type(textarea, 'a perfectly valid message');
    await user.click(screen.getByRole('button', { name: /post/i }));

    await waitFor(() =>
      expect(createMessage).toHaveBeenCalledWith({
        body: 'a perfectly valid message',
        tag: 'PRODUCT',
      }),
    );
    await waitFor(() => expect(textarea).toHaveValue(''));
  });

  it('shows an error message and keeps the draft when the post fails', async () => {
    vi.mocked(createMessage).mockRejectedValue(new Error('Failed to post message (500)'));

    const user = userEvent.setup();
    renderComposer();
    const textarea = screen.getByLabelText('New message');
    await user.type(textarea, 'this one will fail to post');
    await user.click(screen.getByRole('button', { name: /post/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Failed to post message (500)',
    );
    expect(textarea).toHaveValue('this one will fail to post');
  });
});
