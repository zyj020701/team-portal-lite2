import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from './Modal';
describe('Modal', () => {
  it('renders nothing when open is false', () => {
    render(
      <Modal open={false} onClose={vi.fn()} title="Hidden">
        content
      </Modal>,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders title, description and children when open', () => {
    render(
      <Modal open onClose={vi.fn()} title="Confirm" description="Are you sure?">
        <button type="button">OK</button>
      </Modal>,
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-label', 'Confirm');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByText('Confirm')).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'OK' })).toBeInTheDocument();
  });

  it('calls onClose when the backdrop is clicked', () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="T">
        body
      </Modal>,
    );

    // The backdrop is the first child of the dialog container.
    const dialog = screen.getByRole('dialog');
    const backdrop = dialog.firstElementChild as HTMLElement;
    expect(backdrop).not.toBeNull();
    fireEvent.click(backdrop);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the Escape key is pressed', () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="T">
        body
      </Modal>,
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('locks body scroll while open and restores it on unmount', () => {
    const { unmount } = render(
      <Modal open onClose={vi.fn()} title="T">
        body
      </Modal>,
    );

    expect(document.body.style.overflow).toBe('hidden');

    unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('renders the footer when provided', () => {
    render(
      <Modal
        open
        onClose={vi.fn()}
        title="T"
        footer={
          <button type="button" data-testid="cancel">
            Cancel
          </button>
        }
      >
        body
      </Modal>,
    );

    expect(screen.getByTestId('cancel')).toBeInTheDocument();
  });

  it('traps focus within the dialog (Tab wraps from last to first)', () => {
    render(
      <Modal open onClose={vi.fn()} title="T">
        <button type="button">First</button>
        <button type="button">Last</button>
      </Modal>,
    );

    const dialog = screen.getByRole('dialog');
    const panel = dialog.querySelector('[tabindex="-1"]') as HTMLElement;
    const first = screen.getByRole('button', { name: 'First' });
    const last = screen.getByRole('button', { name: 'Last' });

    // Focus starts on the panel.
    expect(panel).toHaveFocus();

    // When focus is on the last element, Tab must wrap back to first.
    last.focus();
    expect(last).toHaveFocus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(first).toHaveFocus();
  });

  it('wraps focus backwards with Shift+Tab', () => {
    render(
      <Modal open onClose={vi.fn()} title="T">
        <button type="button">First</button>
        <button type="button">Last</button>
      </Modal>,
    );

    const first = screen.getByRole('button', { name: 'First' });
    const last = screen.getByRole('button', { name: 'Last' });

    first.focus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(last).toHaveFocus();
  });

  it('keeps focus on the panel when there are no focusable children', () => {
    render(
      <Modal open onClose={vi.fn()} title="T">
        <p>Static text only</p>
      </Modal>,
    );

    const dialog = screen.getByRole('dialog');
    const panel = dialog.querySelector('[tabindex="-1"]') as HTMLElement;
    panel.focus();

    fireEvent.keyDown(document, { key: 'Tab' });
    expect(panel).toHaveFocus();
  });
});
