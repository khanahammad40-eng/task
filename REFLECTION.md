 Reflection: Using AI Agents for the Fuel EU Maritime Project

 What I Learned Using AI Agents

One thing i learned is that the agent is really good at structure and boilerplate but you have to double check anything that has business rules or numbers. For example the agent got the pool algorithm wrong the first time. It was supposed to transfer surplus to deficits so that deficit ships dont exit worse and surplus ships dont go negative. But in the first version it was possible for a surplus ship to end up with cb_after less than zero because we were transfering more than it had. The code was something like allocating from a surplus member without checking that the amount we give doesnt exceed its cb_before. I had to fix it by adding a check that we never assign more from a surplus member than its remaining cb and then decrement that remaining as we go. So that taught me to never trust the agent for invariants like "surplus cannot exit negative" unless i test it with real data.

On the other hand the agent got the PostgreSQL adapter pattern right and that saved me real time. It generated the Prisma route repository that takes the Prisma client and returns an object with findAll, findByRouteId, setBaseline. Each method maps the db row (snake_case) to the domain object (camelCase) with a small toDomain function. I would have written the same thing by hand but it would have taken me half an hour of typing and checking the field names. So for that kind of repetitive adapter code the agent was spot on.

I also learned that the way you prompt makes a huge difference. At the start i was saying things like "create the banking feature" and the agent would give me something vague or mix HTTP and domain logic. Later i got better. For example instead of that i would say something like: create BankSurplus use case in core/application, takes shipId year amount, uses ComplianceRepository and BankRepository interfaces, validate amount doesnt exceed available CB, no express imports, typescript strict mode. With that kind of prompt the output was much closer to what i needed and i had to fix less. So the before and after was basically vague one liner vs clear scope and constraints.

 Efficiency Gains vs Manual Coding

I think the agent saved me about 7 to 8 hours total on boilerplate. Things like the folder structure, the Prisma schema, the Express app setup, the repository adapters and the React tab shells would have taken me a long time to type from scratch. But it also added maybe an hour of fixing wrong outputs. The pool bug, the missing UNIQUE constraint on ship_compliance, the wrong Tailwind class names and a couple of type errors each cost me 10 or 15 minutes. So the net saving was still real, maybe 7 or 8  hours, but its not like the agent wrote the whole thing and i just ran it. I had to understand every part and correct the bits that were wrong.

## Improvements You'd Make Next Time

One thing i will never do again is trusting the agent for regulatory numbers without checking the actual document. The assignment had the target intensity 89.3368 and the 41000 MJ per tonne. The agent sometimes gave 4100 or a slightly different target. I always cross checked with the spec and sometimes had to correct the constant. So next time i will look up the real numbers first and then tell the agent exactly what to use instead of letting it guess.

One thing i will always do next time is commit after every agent session with a message that says what the agent generated. So for example "add CreatePool use case and Prisma pool repository (agent)" or "fix pool cb_after validation (manual)". That way the git history is honest and if something breaks later i can see which commit introduced it and whether it was agent or me. I didnt do that enough this time and it would have made debugging easier.

Overall the agent was really useful for speed and structure but you still have to own the domain logic and the numbers. Next time i would also write down the invariants (like pool rules) in a short list and paste that into the first prompt so the agent has the constraints from the start.
