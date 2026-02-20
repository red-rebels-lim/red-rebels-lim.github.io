import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Spinner } from '@/components/Spinner';

describe('Spinner', () => {
  it('renders a spinning element', () => {
    const { container } = render(<Spinner />);
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).not.toBeNull();
  });
});
