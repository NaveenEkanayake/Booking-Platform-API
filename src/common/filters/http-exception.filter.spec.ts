import { Test, TestingModule } from '@nestjs/testing';
import { AllExceptionsFilter } from './http-exception.filter';
import {
  HttpException,
  HttpStatus,
  BadRequestException,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;

  const mockJson = jest.fn();
  const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
  const mockGetResponse = jest.fn().mockReturnValue({
    status: mockStatus,
  });
  const mockHttpArgumentsHost = jest.fn().mockReturnValue({
    getResponse: mockGetResponse,
    getRequest: jest.fn(),
  });
  const mockArgumentsHost: any = {
    switchToHttp: mockHttpArgumentsHost,
  };

  beforeEach(() => {
    filter = new AllExceptionsFilter();
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  it('should handle HttpException with string response', () => {
    const exception = new HttpException('Custom error', HttpStatus.BAD_REQUEST);
    filter.catch(exception, mockArgumentsHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockJson).toHaveBeenCalledWith({
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'Custom error',
      errors: undefined,
      timestamp: expect.any(String),
    });
  });

  it('should handle BadRequestException with validation errors array', () => {
    const exception = new BadRequestException([
      'email must be an email',
      'password must be longer than or equal to 6 characters',
    ]);
    filter.catch(exception, mockArgumentsHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockJson).toHaveBeenCalledWith({
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'Validation failed',
      errors: expect.any(Array),
      timestamp: expect.any(String),
    });
  });

  it('should include field info in validation errors', () => {
    const exception = new BadRequestException([
      'name must be a string',
      'duration must be a number conforming to the specified constraints',
    ]);
    filter.catch(exception, mockArgumentsHost);

    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        errors: expect.arrayContaining([
          expect.objectContaining({ field: 'name' }),
          expect.objectContaining({ field: 'duration' }),
        ]),
      }),
    );
  });

  it('should handle NotFoundException', () => {
    const exception = new NotFoundException('User not found');
    filter.catch(exception, mockArgumentsHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockJson).toHaveBeenCalledWith({
      statusCode: HttpStatus.NOT_FOUND,
      message: 'User not found',
      errors: undefined,
      timestamp: expect.any(String),
    });
  });

  it('should handle ConflictException', () => {
    const exception = new ConflictException('Email already registered');
    filter.catch(exception, mockArgumentsHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(mockJson).toHaveBeenCalledWith({
      statusCode: HttpStatus.CONFLICT,
      message: 'Email already registered',
      errors: undefined,
      timestamp: expect.any(String),
    });
  });

  it('should handle UnauthorizedException', () => {
    const exception = new UnauthorizedException('Invalid credentials');
    filter.catch(exception, mockArgumentsHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
    expect(mockJson).toHaveBeenCalledWith({
      statusCode: HttpStatus.UNAUTHORIZED,
      message: 'Invalid credentials',
      errors: undefined,
      timestamp: expect.any(String),
    });
  });

  it('should handle generic Error', () => {
    const error = new Error('Something went wrong');
    filter.catch(error, mockArgumentsHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockJson).toHaveBeenCalledWith({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Something went wrong',
      errors: undefined,
      timestamp: expect.any(String),
    });
  });

  it('should handle unknown exceptions with default message', () => {
    filter.catch('unexpected string', mockArgumentsHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockJson).toHaveBeenCalledWith({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      errors: undefined,
      timestamp: expect.any(String),
    });
  });

  it('should include timestamp in ISO format', () => {
    const exception = new NotFoundException('Not found');
    filter.catch(exception, mockArgumentsHost);

    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        timestamp: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
        ),
      }),
    );
  });
});
