import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsModal } from './SettingsModal';

vi.mock('../services/githubApi', () => ({
  githubApi: { testConnection: vi.fn(), syncData: vi.fn(), fetchData: vi.fn() }
}));

const setup = (props = {}) => {
  const onResetWeek = vi.fn();
  const onClose = vi.fn();
  render(
    <SettingsModal
      isOpen
      settings={{ githubToken: '', githubRepo: '', githubBranch: 'main' }}
      onUpdateSettings={vi.fn()}
      onExportJSON={vi.fn()}
      onImportJSON={vi.fn()}
      onTriggerSync={vi.fn()}
      onResetWeek={onResetWeek}
      onClose={onClose}
      {...props}
    />
  );
  return { onResetWeek, onClose };
};

describe('SettingsModal: reset week', () => {
  it('asks for confirmation instead of resetting on the first click', () => {
    const { onResetWeek } = setup();
    fireEvent.click(screen.getByRole('button', { name: '重排本周' }));

    expect(onResetWeek).not.toHaveBeenCalled();
    expect(screen.getByText(/手动调整会被清空/)).toBeInTheDocument();
  });

  it('resets and closes once the confirmation is clicked', () => {
    const { onResetWeek, onClose } = setup();
    fireEvent.click(screen.getByRole('button', { name: '重排本周' }));
    fireEvent.click(screen.getByRole('button', { name: '确认重排' }));

    expect(onResetWeek).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalled();
  });

  it('backs out of the confirmation without resetting', () => {
    const { onResetWeek } = setup();
    fireEvent.click(screen.getByRole('button', { name: '重排本周' }));
    fireEvent.click(screen.getByRole('button', { name: '取消重排' }));

    expect(onResetWeek).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: '重排本周' })).toBeInTheDocument();
  });

  it('says the backlog and history are kept', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: '重排本周' }));
    expect(screen.getByText(/备选池、历史记录与工作重量都会保留/)).toBeInTheDocument();
  });
});
