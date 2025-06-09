import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ReservationWindow from '../ReservationWindow';

// Mock translation function
jest.mock('../../utils/translate', () => ({
  __esModule: true,
  default: (text) => text,
}));

// Mock axios
jest.mock('../../utils/axiosConfig', () => ({
  get: jest.fn(() => Promise.resolve({ data: [] })),
  post: jest.fn(() => Promise.resolve({ data: {} }))
}));

// Mock AuthContext
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    currentUser: { id: 1, username: 'testuser' }
  })
}));

const mockEquipment = {
  id: 1,
  name: 'Test Equipment',
  type: 'Instrument',
  description: 'Test description'
};

describe('ReservationWindow Component', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders reservation window with equipment name', () => {
    render(
      <ReservationWindow equipment={mockEquipment} onClose={mockOnClose} />
    );

    expect(screen.getByText('Reserve Test Equipment')).toBeInTheDocument();
    expect(screen.getByText('×')).toBeInTheDocument();
  });

  test('calls onClose when close button is clicked', () => {
    render(
      <ReservationWindow equipment={mockEquipment} onClose={mockOnClose} />
    );

    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});