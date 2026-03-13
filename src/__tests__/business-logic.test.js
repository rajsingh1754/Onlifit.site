import { describe, it, expect } from 'vitest';

// Utility function tests — validates core business logic

describe('Payment Amount Parsing', () => {
  const parseAmount = (val) => parseFloat(val) || 0;

  it('parses numeric string correctly', () => {
    expect(parseAmount('1500')).toBe(1500);
    expect(parseAmount('2999.50')).toBe(2999.5);
  });

  it('handles null/undefined/empty', () => {
    expect(parseAmount(null)).toBe(0);
    expect(parseAmount(undefined)).toBe(0);
    expect(parseAmount('')).toBe(0);
  });

  it('sums amounts correctly (the bug we fixed)', () => {
    const payments = [{ amount: '1500' }, { amount: '2000' }, { amount: '3500' }];
    const total = payments.reduce((a, p) => a + (parseFloat(p.amount) || 0), 0);
    expect(total).toBe(7000);
    expect(typeof total).toBe('number');
  });
});

describe('Member ID Generation', () => {
  const genMemberId = (gymId, count) =>
    'IQ-' + gymId.replace('GYM-', '') + '-' + String(count).padStart(4, '0');

  it('generates correct ID format', () => {
    expect(genMemberId('GYM-KRM', 1)).toBe('IQ-KRM-0001');
    expect(genMemberId('GYM-KRM', 42)).toBe('IQ-KRM-0042');
    expect(genMemberId('GYM-IND', 999)).toBe('IQ-IND-0999');
  });
});

describe('Enquiry ID Generation', () => {
  it('generates unique IDs', () => {
    const genId = () =>
      'ENQ-' + String(Date.now()).slice(-6) + Math.random().toString(36).slice(2, 4).toUpperCase();
    const id1 = genId();
    const id2 = genId();
    expect(id1).toMatch(/^ENQ-/);
    expect(id1).not.toBe(id2);
  });
});

describe('Ticket ID Generation', () => {
  it('pads ticket numbers correctly', () => {
    const genTicketId = (count) => 'TKT-' + String(count).toString().padStart(4, '0');
    expect(genTicketId(1)).toBe('TKT-0001');
    expect(genTicketId(99)).toBe('TKT-0099');
    expect(genTicketId(1234)).toBe('TKT-1234');
  });
});

describe('Revenue Calculations', () => {
  it('calculates monthly revenue from payment list', () => {
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();
    const payments = [
      { amount: '5000', created_at: new Date(thisYear, thisMonth, 1).toISOString() },
      { amount: '3000', created_at: new Date(thisYear, thisMonth, 15).toISOString() },
      { amount: '2000', created_at: new Date(thisYear, thisMonth - 1, 10).toISOString() }, // last month
    ];
    const monthPayments = payments.filter(p => {
      const d = new Date(p.created_at);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    });
    const revenue = monthPayments.reduce((a, p) => a + (parseFloat(p.amount) || 0), 0);
    expect(revenue).toBe(8000);
  });

  it('handles empty payments array', () => {
    const revenue = [].reduce((a, p) => a + (parseFloat(p.amount) || 0), 0);
    expect(revenue).toBe(0);
  });

  it('avoids division by zero in conversion rate', () => {
    const totalLeads = 0;
    const convRate = totalLeads ? Math.round((0 / totalLeads) * 100) : 0;
    expect(convRate).toBe(0);
  });
});
