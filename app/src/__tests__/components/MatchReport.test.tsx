import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}));

import { MatchReport } from '@/components/calendar/MatchReport';

describe('Task 08: MatchReport component', () => {
  const reportEN = 'Nea Salamina secured a comfortable 3-0 victory at home.';
  const reportEL = 'Η Νέα Σαλαμίνα πέτυχε μια άνετη νίκη 3-0 εντός έδρας.';

  describe('Acceptance Criteria', () => {
    it('should render the report header for played matches', () => {
      render(<MatchReport reportEN={reportEN} reportEL={reportEL} />);
      expect(screen.getByText('matchReport.title')).toBeDefined();
    });

    it('should be collapsed by default — report text hidden', () => {
      render(<MatchReport reportEN={reportEN} reportEL={reportEL} />);
      expect(screen.queryByText(reportEN)).toBeNull();
    });

    it('should expand and show English text when clicked (lang="en")', () => {
      render(<MatchReport reportEN={reportEN} reportEL={reportEL} lang="en" />);
      fireEvent.click(screen.getByText('matchReport.title'));
      expect(screen.getByText(reportEN)).toBeDefined();
    });

    it('should show Greek text when lang="el"', () => {
      render(<MatchReport reportEN={reportEN} reportEL={reportEL} lang="el" />);
      fireEvent.click(screen.getByText('matchReport.title'));
      expect(screen.getByText(reportEL)).toBeDefined();
    });

    it('should collapse again when header clicked a second time', () => {
      render(<MatchReport reportEN={reportEN} reportEL={reportEL} lang="en" />);
      const header = screen.getByText('matchReport.title');
      fireEvent.click(header); // expand
      expect(screen.getByText(reportEN)).toBeDefined();
      fireEvent.click(header); // collapse
      expect(screen.queryByText(reportEN)).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should render nothing when both reports are empty', () => {
      const { container } = render(<MatchReport reportEN="" reportEL="" />);
      expect(container.innerHTML).toBe('');
    });

    it('should render nothing when both reports are undefined', () => {
      const { container } = render(<MatchReport />);
      expect(container.innerHTML).toBe('');
    });

    it('should fall back to English when Greek report is missing', () => {
      render(<MatchReport reportEN={reportEN} reportEL="" lang="el" />);
      fireEvent.click(screen.getByText('matchReport.title'));
      expect(screen.getByText(reportEN)).toBeDefined();
    });

    it('should fall back to Greek when English report is missing', () => {
      render(<MatchReport reportEN="" reportEL={reportEL} lang="en" />);
      fireEvent.click(screen.getByText('matchReport.title'));
      expect(screen.getByText(reportEL)).toBeDefined();
    });
  });
});
