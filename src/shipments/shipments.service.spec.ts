import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { ShipmentEntity } from './entities/shipment.entity';
import { ShipmentRulesService } from './shipment-rules.service';
import { ShipmentStatus } from './shipment-status.enum';
import { ShipmentsService } from './shipments.service';

// CASO 1
describe('ShipmentsService', () => {
  let service: ShipmentsService;

  const repositoryMock = {
    find: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const rulesServiceMock = {
    ensureCanBeDispatched: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        ShipmentsService,
        {
          provide: getRepositoryToken(ShipmentEntity),
          useValue: repositoryMock,
        },
        {
          provide: ShipmentRulesService,
          useValue: rulesServiceMock,
        },
      ],
    }).compile();

    service = moduleRef.get(ShipmentsService);
  });

    it('is defined', () => {
    expect(service).toBeDefined();
    });
// Caso 2
    it('returns all shipments', async () => {
  // Arrange
  const shipments: ShipmentEntity[] = [
    {
      id: 1,
      trackingCode: 'SHIP-001',
      destination: 'Cali',
      status: ShipmentStatus.CREATED,
    },
    {
      id: 2,
      trackingCode: 'SHIP-002',
      destination: 'Bogota',
      status: ShipmentStatus.CREATED,
    },
  ];

  repositoryMock.find.mockResolvedValue(shipments);

  // Act
  const result = await service.findAll();

  // Assert
  expect(result).toEqual(shipments);
  expect(repositoryMock.find).toHaveBeenCalledTimes(1);
    });
// caso 3
    it('returns a shipment when the id exists', async () => {
  // Arrange
  const shipment: ShipmentEntity = {
    id: 7,
    trackingCode: 'SHIP-007',
    destination: 'Cali',
    status: ShipmentStatus.CREATED,
  };

  repositoryMock.findOneBy.mockResolvedValue(shipment);

  // Act
  const result = await service.findOne(7);

  // Assert
  expect(result).toEqual(shipment);
  expect(repositoryMock.findOneBy).toHaveBeenCalledWith({ id: 7 });
});
// Caso 4
it('throws NotFoundException when the id does not exist', async () => {
  // Arrange
  repositoryMock.findOneBy.mockResolvedValue(null);

  // Act and Assert
  await expect(service.findOne(999)).rejects.toBeInstanceOf(
    NotFoundException,
  );
});
// Caso 5

it('creates and saves a shipment', async () => {
  // Arrange
  const data: CreateShipmentDto = {
    trackingCode: 'SHIP-100',
    destination: 'Cali',
  };

  const createdShipment = {
    ...data,
    status: ShipmentStatus.CREATED,
  } as ShipmentEntity;

  const savedShipment: ShipmentEntity = {
    ...createdShipment,
    id: 1,
  };

  repositoryMock.create.mockReturnValue(createdShipment);
  repositoryMock.save.mockResolvedValue(savedShipment);

  // Act
  const result = await service.create(data);

  // Assert
  expect(repositoryMock.create).toHaveBeenCalledWith({
    ...data,
    status: ShipmentStatus.CREATED,
  });

  expect(repositoryMock.save).toHaveBeenCalledWith(createdShipment);
  expect(result).toEqual(savedShipment);
});

// caso 6
it('dispatches and saves a valid shipment', async () => {
  // Arrange
  const shipment: ShipmentEntity = {
    id: 3,
    trackingCode: 'SHIP-003',
    destination: 'Medellin',
    status: ShipmentStatus.CREATED,
  };

  const savedShipment: ShipmentEntity = {
    ...shipment,
    status: ShipmentStatus.DISPATCHED,
  };

  repositoryMock.findOneBy.mockResolvedValue(shipment);
  repositoryMock.save.mockResolvedValue(savedShipment);

  // Act
  const result = await service.dispatch(3);

  // Assert
  expect(rulesServiceMock.ensureCanBeDispatched)
    .toHaveBeenCalledWith(shipment);

  expect(shipment.status).toBe(ShipmentStatus.DISPATCHED);
  expect(repositoryMock.save).toHaveBeenCalledWith(shipment);
  expect(result).toEqual(savedShipment);
});
});