import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import axe from 'axe-core';
import { AccessibilityBar } from './accessibility-bar';

// jsdom layout hisoblamaydi — kontrast qoidasi brauzer/CI'da tekshiriladi.
const axeOptions: axe.RunOptions = {
  rules: { 'color-contrast': { enabled: false } },
};

describe('AccessibilityBar', () => {
  beforeEach(() => {
    document.documentElement.setAttribute('data-theme', 'oq');
    document.documentElement.setAttribute('data-font-scale', 'md');
  });

  it('is an accessible toolbar with labelled controls', async () => {
    const { container } = render(<AccessibilityBar />);
    expect(screen.getByRole('toolbar', { name: "Ko'rish sozlamalari" })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: "Ko'rinish rejimi" })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: "Matn o'lchovi" })).toBeInTheDocument();

    const results = await axe.run(container, axeOptions);
    expect(results.violations).toEqual([]);
  });

  it('reflects the current theme via aria-pressed', () => {
    render(<AccessibilityBar />);
    // default "oq" — faqat shu tugma bosilgan holatda
    expect(screen.getByRole('button', { name: "Yorug'" })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Tungi' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Yuqori kontrast' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('tema tugmasi bosilganda data-theme atributi va localStorage yangilanadi', () => {
    render(<AccessibilityBar />);
    fireEvent.click(screen.getByRole('button', { name: 'Tungi' }));
    expect(document.documentElement.getAttribute('data-theme')).toBe('tun');
    expect(localStorage.getItem('imkon-theme')).toBe('tun');
  });

  it('A+ tugmasi bosilganda har safar keyingi bosqichga o\'tadi (bir martada to\'xtab qolmaydi)', () => {
    render(<AccessibilityBar />);
    const bigger = screen.getByRole('button', { name: 'Matnni kattalashtirish' });

    // md -> lg -> xl (2 marta bosilsa 2 bosqich siljishi kerak, 1 martada emas)
    fireEvent.click(bigger);
    expect(document.documentElement.getAttribute('data-font-scale')).toBe('lg');
    fireEvent.click(bigger);
    expect(document.documentElement.getAttribute('data-font-scale')).toBe('xl');

    // Eng katta bosqichda tugma o'chirilgan (yana kattalashtirmaydi)
    expect(bigger).toBeDisabled();
  });

  it('A− tugmasi eng kichik bosqichdan pastga tushmaydi', () => {
    document.documentElement.setAttribute('data-font-scale', 'sm');
    render(<AccessibilityBar />);
    const smaller = screen.getByRole('button', { name: 'Matnni kichiklashtirish' });

    fireEvent.click(smaller);
    expect(document.documentElement.getAttribute('data-font-scale')).toBe('xs');
    expect(smaller).toBeDisabled();
  });
});
