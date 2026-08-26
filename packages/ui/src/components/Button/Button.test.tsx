import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders its children and fires onClick when clicked', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);

    const button = screen.getByRole('button', { name: /save/i });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled and does not fire onClick when disabled is true', () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        Cancelled
      </Button>,
    );

    const button = screen.getByRole('button', { name: /cancelled/i });
    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('is disabled while loading and shows a spinner', () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} loading>
        Submitting
      </Button>,
    );

    const button = screen.getByRole('button', { name: /submitting/i });
    // loading forces disabled.
    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();

    // The spinner svg is present and hidden from assistive tech.
    expect(button.querySelector('svg')).not.toBeNull();
    expect(button.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('applies the destructive variant class', () => {
    render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByRole('button', { name: /delete/i });
    expect(button.className).toContain('bg-error-600');
  });
});
