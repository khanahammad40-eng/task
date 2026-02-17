AI Agent Workflow Log

## Agents Used

I used Claude Code and Cursor Agent together for this project. Claude was used first for the big picture thinking and folder structure. Cursor was used for actually writing code file by file. 

For each step below i wrote what i was trying to do in one sentence, the exact prompt i typed in a code block, what the agent gave back with a short snippet and description, and what i had to fix.





## PROMPTS AND OUTPUTS 




 Step 1 – Hexagonal folder structure

I was trying to get the right folder layout for both backend and frontend so the hexagonal architecture would be clear.


Design the hexagonal (ports and adapters) folder structure for a Fuel EU Maritime backend (Node + TypeScript + PostgreSQL) and frontend (React + TypeScript + Tailwind). Show the full folder tree for both. Core must not depend on any framework.


The agent gave back a full tree. Backend had src/core/domain, src/core/application, src/core/ports, src/adapters/inbound/http, src/adapters/outbound/postgres, src/infrastructure. Frontend had src/core/domain, src/core/ports, src/adapters/ui, src/adapters/infrastructure. At first i didnt understand why core/ cannot import from express or anything from the framework. Claude explained that in hexagonal the core is the center and it only knows about the ports (interfaces), so the adapters are the ones that import express or prisma and implement those interfaces. That made sense after that.

I didnt have to fix much here, the structure was good from the start.







 Step 2 – Domain entities

I was trying to get all the domain types for the app: Route, ComplianceBalance, BankEntry, Pool.



Write the domain entities for Fuel EU Maritime: Route (with routeId, vesselType, fuelType, year, ghgIntensity, fuelConsumption, distance, totalEmissions, isBaseline), ComplianceBalance (shipId, year, cb), BankEntry, and Pool with PoolMemberAllocation. Use TypeScript interfaces only, no implementation.

The agent gave back four interfaces. Route had all the fields in camelCase. ComplianceBalance had shipId, year, cb. BankEntry had id, shipId, year, amountGco2eq, createdAt. Pool had CreatePoolCommand and CreatePoolResult with members array of shipId, cbBefore, cbAfter. I had to ask a follow up because in one of the types it used "any" for an array and i wanted proper typing. I said "replace any with the proper type for the members array" and it fixed it.






 Step 3 – Repository port interfaces

I was trying to get the outbound port interfaces that the use cases would depend on (repositories).


Write the port interfaces for the repositories: RouteRepository (findAll, findByRouteId, setBaseline), ComplianceRepository (getCb, upsertCb, getAdjustedCb), BankRepository (getRecords, getTotalBanked, bank, apply), PoolRepository (createPool). These are used by the use cases. No implementation, only TypeScript interfaces.


The output was clean. Each interface had the right method signatures and return types. I didnt know how to wire them yet though, like which adapter would implement which port. I left that for later when i asked for the Express routers and the Prisma repositories.






 Step 4 – Compute CB formula

I was trying to get the compliance balance formula in TypeScript based on the Fuel EU regulation.

Implement the Fuel EU compliance balance formula in TypeScript. CB = (Target - Actual) x Energy in scope. Energy in scope = fuelConsumption (tonnes) x 41000 MJ per tonne. Target for 2025 is 89.3368 gCO2e/MJ. Export a function that takes targetIntensity, actualIntensity, fuelConsumptionTonnes and returns the CB value.


The agent gave back a function computeCbFromRoute with the formula (targetIntensity - actualIntensity) * (fuelConsumptionTonnes * 41000). It also had constants for TARGET_INTENSITY_2025 and MJ_PER_TONNE_FUEL. I cross checked the math manually for the R001 route from the spec (91.0 intensity, 5000 tonnes) and the sign and size of the result made sense so i kept it.







Step 5 – PostgreSQL migration with 5 tables

I was trying to get the database schema for all 5 tables (routes, ship_compliance, bank_entries, pools, pool_members).


Write the Prisma schema for Fuel EU Maritime: Route table (id, route_id unique, vessel_type, fuel_type, year, ghg_intensity, fuel_consumption, distance, total_emissions, is_baseline), ShipCompliance (ship_id, year, cb_gco2eq), BankEntry (ship_id, year, amount_gco2eq), Pool (id, year, created_at), PoolMember (pool_id, ship_id, cb_before, cb_after). Include indexes where needed.


The agent gave back the full schema with all columns. Cursor forgot to add the UNIQUE constraint on ship_id + year for the ShipCompliance table. I had to add @@unique([ship_id, year]) myself because the compliance balance is per ship per year and we need to upsert by that pair.







 Step 6 – Seed script with 5 routes

I was trying to get the seed file that inserts the 5 routes from the spec table.

Write a Prisma seed script that inserts the 5 routes from the Fuel EU spec: R001 Container HFO 2024 91.0 5000 12000 4500 baseline true, R002 BulkCarrier LNG 2024 88.0 4800 11500 4200, R003 Tanker MGO 2024 93.5 5100 12500 4700, R004 RoRo HFO 2025 89.2 4900 11800 4300, R005 Container LNG 2025 90.5 4950 11900 4400. Use upsert by route_id. Set R001 as baseline.


The output was correct. It had the routes array with all the numbers and the loop with upsert where route_id was the unique key. R001 had is_baseline true and the rest false. Everything was correct here so i didnt change anything.









Step 7 – Express routers

I was trying to get the HTTP routes for routes, compliance, banking, and pools.


Create the Express routers for the Fuel EU API: GET /routes, POST /routes/:routeId/baseline, GET /routes/comparison, GET /compliance/cb, GET /compliance/adjusted-cb, GET /banking/records, POST /banking/bank, POST /banking/apply, POST /pools. Wire them to the use cases. Use the handlers from the inbound adapters.


The agent gave back the server file with app.get and app.post for each path. The routes/comparison endpoint was missing the baseline check. It was returning all routes compared to something but i needed to make sure we only compare when there is a baseline route set. I had to ask again: "For GET /routes/comparison we need to first get the baseline route and only return comparisons against it. If no baseline exists return empty array." Then it fixed the use case and the handler.










 Step 8 – Greedy pool allocation (Article 21)

I was trying to implement the pooling logic where surplus ships transfer to deficit ships and we have to respect the rules that deficit ship cannot exit worse and surplus ship cannot exit negative.


Implement the Fuel EU Article 21 pooling algorithm. We have a list of ships with their adjusted CB. Sum of CB must be >= 0 to create a pool. Greedy: sort by CB descending (surplus first). Transfer surplus to deficits. Rules: deficit ship cannot exit worse than before (cb_after >= cb_before), surplus ship cannot exit negative (cb_after >= 0). Return the allocations with cb_before and cb_after per member.


This was the hardest part. The first output had a bug where in some cases a deficit ship was exiting with cb_after worse than cb_before. The logic was iterating in the wrong order or not updating the surplus remaining correctly. I had to fix it with a follow up prompt: "There is a bug: when we allocate from surplus to deficit we must decrement the surplus remaining and the deficit ship must get cb_after = cb_before + amount received. Make sure we never assign more than the deficit needs and never leave a surplus ship with negative cb_after." The agent rewrote the inner loop and then i tested with two ships one surplus one deficit and it worked.










Step 9 – React hooks (useRoutes, useBanking, usePooling, useComparison)

I was trying to get the data fetching hooks that call the API and hold loading and error state.


Write React hooks for the Fuel EU dashboard: useRoutes (fetch routes, refetch after setBaseline), useComparison (fetch comparison data), useBanking (shipId, year, getCb, bank, apply with cb state), usePooling (year, fetch adjusted CB list, createPool). Each hook should return data, loading, error and the action functions. Use the API client from the infrastructure adapter.


The agent gave back the hook signatures and the useState and useEffect for fetching. Copilot helped complete the repetitive parts when i was typing the second and third hooks because the pattern was the same (loading true, fetch, set data, set loading false, catch error). So i got useRoutes and useComparison from the agent and then Copilot suggested the rest of the useState and useEffect blocks for useBanking and usePooling which saved time.









 Step 10 – RouteTable component with filters

I was trying to get the table that shows all routes with filters for vesselType, fuelType, year and the Set Baseline button.


Create the RoutesTab component: a table with columns routeId, vesselType, fuelType, year, ghgIntensity, fuelConsumption, distance, totalEmissions, and a Set Baseline button. Add filter dropdowns for vesselType, fuelType, year above the table. Use Tailwind with an ocean or maritime color palette (blues and teals).


The agent gave back the table and the filters. The Tailwind class names for the ocean color palette were wrong. It used things like bg-ocean-500 or text-maritime-700 which are not real Tailwind classes. I had to fix them to real classes like bg-slate-800, text-emerald-400, border-slate-700 so the UI would actually compile and look good.








 Step 11 – Compare tab with Recharts bar chart

I was trying to get the Compare tab with the baseline vs comparison table and a bar chart.

Build the Compare tab: fetch data from GET /routes/comparison. Show a table with routeId, baselineGhgIntensity, comparisonGhgIntensity, percentDiff, compliant (checkmark or cross). Add a Recharts bar chart comparing baseline and comparison ghgIntensity per route. Show the target line at 89.3368.


The agent gave back the tab with the table and a BarChart from recharts. The chart labels were wrong. The x-axis was showing the wrong field and the tooltip was not showing the right names (it said "baseline" and "comparison" but the data keys were different). I had to fix the dataKey and the name props on the Bar components and the ReferenceLine so the target showed correctly.







 Step 12 – Banking tab UI with KPIs

I was trying to get the Banking tab with ship/year inputs and the KPIs cb_before, applied, cb_after and the Bank and Apply buttons.


Create the Banking tab: inputs for shipId and year. On load call GET /compliance/cb and show the current CB. Buttons: Bank surplus (calls POST /banking/bank, disabled if CB <= 0), Apply banked (input for amount, calls POST /banking/apply). After apply show the result with cb_before, applied, cb_after. Use the same Tailwind style as the other tabs.


The agent gave back the form with the two inputs, the display of CB, the Bank button disabled when cb <= 0, and the Apply section with amount input and the result box showing cb_before, applied, cb_after. This worked well and i only had to align the spacing with the rest of the app.


## VALIDATIONS AND CORRECTIONS 

I ran tsc --noEmit after every agent session to catch type errors. Sometimes the agent would return something that looked right but had a missing import or a wrong generic and the build would fail. Doing that after each step meant i could tell the agent "there is a type error in the ComplianceRepository, the getCb return type should be Promise<ComplianceBalance | null>" and fix it before moving on.

I manually tested the CB formula with a calculator for the R001 route. I had the numbers from the spec (91.0 intensity, 5000 tonnes, target 89.3368) and i did (89.3368 - 91) * 5000 * 41000 on the calculator to get a negative number because R001 is above target. The agent output matched that so i was confident the formula was right.

I used curl commands to test each API endpoint after the backend was wired. I did curl http://localhost:3001/routes and checked the JSON, then curl -X POST http://localhost:3001/routes/R002/baseline, then GET /routes/comparison and so on. That way i could see if the status code was 200 or 400 and if the body was what i expected. One bug i found was in the pool algorithm: when we had one surplus and two deficits, in the first version the surplus ship was going negative (cb_after less than zero) because we were transferring more than it had. I caught it by creating a pool with specific ship IDs and checking the response. I went back and added a check that we never assign more from a surplus member than its cb_before and the agent fixed the loop.

I also checked that no express or prisma imports exist in the core/ folder using grep. I ran grep -r "from 'express'" src/core and grep -r "@prisma" src/core and made sure nothing showed up. That way the hexagonal rule was kept and the core stayed clean.



## OBSERVATIONS

Where it really saved time was boilerplate. The tsconfig files, the Prisma schema structure, the Express app setup with cors and json, and the repetitive adapter files (like the Prisma route repository that maps db rows to domain objects) would have taken me a long time to type by hand. The agent generated those in one go and i could just adjust the names or add a field. Same for the React components: the table structure and the filter dropdowns are a lot of JSX and having a first version to edit was much faster than starting from zero.

Where it failed or was unreliable was with exact numbers and with things that are not in the training data. The regulatory numbers like 89.3368 and 41000 i always checked. The agent sometimes gave me 4100 instead of 41000 or a wrong target. Tailwind custom colors were hallucinated (like bg-ocean-500) because Tailwind does not have those out of the box. And the SQL or Prisma upsert syntax for a compound unique key was wrong the first time (Cursor forgot the unique on ship_id and year). So for anything that has to be exact or is very specific to the stack i double checked.

Combining Claude for thinking and Cursor for typing and Copilot for repetition was the best workflow i found. I would ask Claude to design the structure or explain the pooling rules, then in Cursor i would say "now implement the CreatePool use case in this file" and it would write the code in place. When i was writing the hooks or the table rows and it was the same pattern again, Copilot would suggest the next few lines and i could tab through. Honestly i think without these tools this would have taken me 3x longer but its not magic either. You still have to understand what you want and catch the mistakes.



## BEST PRACTICES 

Always paste the full spec or the relevant part of the assignment into the first prompt so the agent knows the constraints. Commit after every agent session so you can revert if the next step breaks something. Never trust the agent for regulatory numbers or constants. Look them up or compute them yourself and then tell the agent what to use. Run tsc after every generation so type errors dont pile up. Test the math by hand before writing tests so you know what the expected value is. When something is wrong give a short follow up prompt with the exact fix you need instead of saying "it doesnt work." Use grep or search to make sure the architecture rules are kept (no framework in core). Keep the prompts focused on one thing per step so the output is easier to check.
