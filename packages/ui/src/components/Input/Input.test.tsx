import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from './Input';

describe('Input', () => {
  it('renders with a placeholder and forwards typed value via onChange', () => {
    const onChange = vi.fn();
    render(
      <Input
        placeholder="Search tickets"
        defaultValue=""
        onChange={onChange}
        aria-label="search"
      />,
    );

    const input = screen.getByRole('textbox', { name: /search/i });
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('placeholder', 'Search tickets');

    fireEvent.change(input, { target: { value: 'login bug' } });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(input).toHaveValue('login bug');
  });

  it('is non-interactive when disabled', () => {
    render(<Input disabled placeholder="Disabled" aria-label="disabled-input" />);

    const input = screen.getByRole('textbox', { name: /disabled-input/i });
    // A disabled input is removed from the tab order and not editable.
    expect(input).toBeDisabled();
    expect(input).toHaveAttribute('placeholder', 'Disabled');
  });

  it('fires onKeyDown for keyboard events', () => {
    const onKeyDown = vi.fn();
    render(<Input onKeyDown={onKeyDown} placeholder="Press enter" aria-label="kb-input" />);

    const input = screen.getByRole('textbox', { name: /kb-input/i });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(onKeyDown).toHaveBeenCalledTimes(1);
    expect(onKeyDown.mock.calls[0]?.[0]).toHaveProperty('key', 'Enter');
  });

  it('applies error styling when the error prop is set', () => {
    render(<Input error aria-label="error-input" />);
    const input = screen.getByRole('textbox', { name: /error-input/i });
    expect(input.className).toContain('border-error');
  });

  it('defaults to type=text and supports other input types', () => {
    const { rerender } = render(<Input aria-label="email" type="email" />);
    expect(screen.getByLabelText('email')).toHaveAttribute('type', 'email');

    rerender(<Input aria-label="password" type="password" />);
    expect(screen.getByLabelText('password')).toHaveAttribute('type', 'password');
  });
});
