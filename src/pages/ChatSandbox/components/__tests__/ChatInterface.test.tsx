import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ChatInterface from '../ChatInterface';
import type { Message } from '../../../../types';

describe('ChatInterface', () => {
  const mockProperty = {
    name: 'Villa Test',
    address: '123 Test Street',
  };

  const mockMessages: Message[] = [
    {
      id: '1',
      content: 'Hello',
      sender: 'guest',
      timestamp: new Date('2025-01-18T10:30:00')
    },
    {
      id: '2',
      content: 'Hi! How can I help you?',
      sender: 'host',
      timestamp: new Date('2025-01-18T10:31:00')
    },
  ];

  const mockOnSendMessage = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders property information', () => {
    render(
      <ChatInterface
        property={mockProperty}
        messages={mockMessages}
        onSendMessage={mockOnSendMessage}
      />
    );

    expect(screen.getByText(mockProperty.name)).toBeInTheDocument();
    expect(screen.getByText(mockProperty.address)).toBeInTheDocument();
  });

  it('renders messages correctly', () => {
    render(
      <ChatInterface
        property={mockProperty}
        messages={mockMessages}
        onSendMessage={mockOnSendMessage}
      />
    );

    mockMessages.forEach(message => {
      expect(screen.getByText(message.content)).toBeInTheDocument();
    });
  });

  it('handles message submission', () => {
    render(
      <ChatInterface
        property={mockProperty}
        messages={mockMessages}
        onSendMessage={mockOnSendMessage}
      />
    );

    const input = screen.getByPlaceholderText(/tapez un message/i);
    const sendButton = screen.getByRole('button');

    // Test empty message
    fireEvent.click(sendButton);
    expect(mockOnSendMessage).not.toHaveBeenCalled();

    // Test valid message
    const testMessage = 'Test message';
    fireEvent.change(input, { target: { value: testMessage } });
    fireEvent.click(sendButton);
    expect(mockOnSendMessage).toHaveBeenCalledWith(testMessage);
    expect(input).toHaveValue('');
  });

  it('handles message submission with Enter key', () => {
    render(
      <ChatInterface
        property={mockProperty}
        messages={mockMessages}
        onSendMessage={mockOnSendMessage}
      />
    );

    const input = screen.getByPlaceholderText(/tapez un message/i);
    const testMessage = 'Test message';
    
    fireEvent.change(input, { target: { value: testMessage } });
    fireEvent.keyPress(input, { key: 'Enter', code: 13, charCode: 13 });
    
    expect(mockOnSendMessage).toHaveBeenCalledWith(testMessage);
    expect(input).toHaveValue('');
  });

  it('disables send button when input is empty', () => {
    render(
      <ChatInterface
        property={mockProperty}
        messages={mockMessages}
        onSendMessage={mockOnSendMessage}
      />
    );

    const sendButton = screen.getByRole('button');
    expect(sendButton).toBeDisabled();

    const input = screen.getByPlaceholderText(/tapez un message/i);
    fireEvent.change(input, { target: { value: 'Test' } });
    expect(sendButton).not.toBeDisabled();

    fireEvent.change(input, { target: { value: '' } });
    expect(sendButton).toBeDisabled();
  });
});
