import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from './button';
import { Input } from './input';
import { StepBadge } from './badge';

describe('Button', () => {
  it('defaults to type="button" to avoid accidental form submits', () => {
    render(<Button>Kursni boshlash</Button>);
    expect(screen.getByRole('button', { name: 'Kursni boshlash' })).toHaveAttribute(
      'type',
      'button',
    );
  });

  it('carries a visible focus ring class for keyboard users', () => {
    render(<Button>Yuborish</Button>);
    expect(screen.getByRole('button')).toHaveClass('focus-visible:ring-2');
  });
});

describe('Input', () => {
  it('links label, hint and error to the field for screen readers', () => {
    render(<Input label="Telefon" error="Telefon raqami noto'g'ri" defaultValue="123" />);
    const field = screen.getByLabelText('Telefon');
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(field.getAttribute('aria-describedby')).toContain('-error');
    expect(screen.getByText("Telefon raqami noto'g'ri")).toBeInTheDocument();
  });
});

describe('StepBadge', () => {
  it('exposes the ladder step to assistive tech and shows the number', () => {
    render(<StepBadge step={3} />);
    const badge = screen.getByLabelText("Narvon pog'onasi 3");
    expect(badge).toHaveTextContent('3');
  });
});
