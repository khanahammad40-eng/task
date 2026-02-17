import express from 'express';
import cors from 'cors';
import { createRoutesHandler } from '../adapters/inbound/http/routes-handler';
import { createComplianceHandler } from '../adapters/inbound/http/compliance-handler';
import { createBankingHandler } from '../adapters/inbound/http/banking-handler';
import { createPoolsHandler } from '../adapters/inbound/http/pools-handler';
import { createPrismaRouteRepository } from '../adapters/outbound/postgres/prisma-route-repository';
import { createPrismaComplianceRepository } from '../adapters/outbound/postgres/prisma-compliance-repository';
import { createPrismaBankRepository } from '../adapters/outbound/postgres/prisma-bank-repository';
import { createPrismaPoolRepository } from '../adapters/outbound/postgres/prisma-pool-repository';
import { createComputeComparisonUseCase } from '../core/application/compute-comparison';
import {
  createGetCbUseCase,
  createGetAdjustedCbUseCase,
} from '../core/application/compute-cb';
import { createBankSurplusUseCase } from '../core/application/bank-surplus';
import { createApplyBankedUseCase } from '../core/application/apply-banked';
import { createCreatePoolUseCase } from '../core/application/create-pool';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const routeRepo = createPrismaRouteRepository(prisma);
const complianceRepo = createPrismaComplianceRepository(prisma);
const bankRepo = createPrismaBankRepository(prisma);
const poolRepo = createPrismaPoolRepository(prisma);

const getCb = createGetCbUseCase(routeRepo, complianceRepo);
const getAdjustedCb = createGetAdjustedCbUseCase(getCb, bankRepo);
const computeComparison = createComputeComparisonUseCase(routeRepo);
const bankSurplus = createBankSurplusUseCase(getCb, bankRepo);
const applyBanked = createApplyBankedUseCase(getCb, bankRepo);
const createPool = createCreatePoolUseCase(complianceRepo, poolRepo);

const routesHandler = createRoutesHandler(routeRepo, computeComparison);
const complianceHandler = createComplianceHandler(getCb, getAdjustedCb, routeRepo);
const bankingHandler = createBankingHandler(bankRepo, bankSurplus, applyBanked);
const poolsHandler = createPoolsHandler(createPool);

const app = express();
app.use(cors());
app.use(express.json());

app.get('/routes', routesHandler.getAll);
app.post('/routes/:routeId/baseline', routesHandler.setBaseline);
app.get('/routes/comparison', routesHandler.getComparison);

app.get('/compliance/cb', complianceHandler.getCb);
app.get('/compliance/adjusted-cb', complianceHandler.getAdjustedCb);

app.get('/banking/records', bankingHandler.getRecords);
app.post('/banking/bank', bankingHandler.bank);
app.post('/banking/apply', bankingHandler.apply);

app.post('/pools', poolsHandler.create);

export { app, prisma };
