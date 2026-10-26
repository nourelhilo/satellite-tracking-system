# satellite tracking system

a simple full stack satellite project built for the application security course. after login, the screen is an interactive earth view with add satellite, manage satellites, and log out controls. satellite positions and telemetry are saved in supabase postgres.

## stack

- frontend: react, vite, react three fiber, three.js
- backend: node.js and express
- database: supabase postgres with the `pg` driver
- authentication: bcryptjs password hashes and a jwt in an http-only cookie

this project uses its own express authentication routes. it does not use supabase auth or expose database credentials to the browser.

## run locally

requirements: node.js 20.19+ (or 22.12+), npm, and a supabase project.

1. run `npm install`, then `npm run setup` in this folder.
2. copy `server/.env.example` to `server/.env`.
3. in the supabase dashboard, open **connect > direct > session pooler** and copy the connection string into `database_url`. replace `[YOUR-PASSWORD]` with the database password and percent-encode special characters in the uri.
4. replace `jwt_secret` with a random secret of at least 32 characters. for example, run `node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"` and paste the result into `server/.env`.
5. run `npm run dev` and open the local address printed by vite.

the local `.env` is already configured on this computer and is ignored by git. the server uses the bundled supabase ca certificate to verify its encrypted database connection. on startup it creates the `orbit_desk` schema and tables if they do not exist. the vite server sends `/api` requests to express on port 4000.

for a temporary local preview without connecting to supabase, run `npm run dev:demo`. demo data resets when the command stops.

for a production build, run `npm run build`, set `NODE_ENV=production`, and start the server with `npm run start --prefix server`. set `database_url` and `jwt_secret` as deployment secrets. use https in production because the session cookie is marked secure there.

## current features

- sign up, log in, stay signed in for one day, and log out
- each account can view and manage only its own satellite records
- add, edit, and delete satellite records
- store an operator name, orbit type, ground station name, latest position, and latest telemetry with each satellite
- keep the main screen to the earth view and three controls; satellite details are managed in a side panel and form
- load two fictional sample satellites adapted from the database report into an empty account
- rotate an earth scene with nasa earth and landsat 8 3d models
- place each satellite marker using its saved latitude and longitude; the selected record shows the landsat model at that point
- click the earth to fill latitude and longitude when adding a satellite

the globe uses saved coordinates. it does not calculate an orbit or retrieve live positions. model distance from earth is for visibility, not a scale rendering of altitude. the sample satellites and readings are fictional.

## how the database report maps to this version

the original report uses relational tables such as `satellite`, `operator`, `orbit`, `groundstation`, `positionreport`, and `telemetryreport`. this first postgres version stores each user's current satellite details with position and telemetry in `orbit_desk.satellites`. position and telemetry are jsonb fields for now. history tables, alert acknowledgement, and more detailed operator and ground station records can be added as those parts of the course are implemented. the original oracle sql is reference material, not code run by postgres.

## security work log

the course readme template is the checklist for work completed over time. only checked items are currently implemented.

- [x] account registration and login
- [x] password hashing with bcrypt
- [x] http-only, same-site session cookie with a one-day expiry
- [x] basic input checks and per-user access to satellite records
- [x] parameterized sql queries
- [x] verified tls connection to supabase postgres
- [x] app tables in a dedicated schema with row level security enabled and no public policies
- [ ] role-based access control
- [ ] separate position and telemetry history
- [ ] alert generation and acknowledgement
- [ ] encryption for any sensitive fields that actually need it
- [ ] detailed input and output security review
- [ ] security headers and content security policy
- [ ] login rate limiting
- [ ] stride threat model
- [ ] dread risk assessment
- [ ] code scanning reports and screenshots
- [ ] deployment and production security review

the unchecked items are planned course work. they are not claimed as completed.

## 3d model credits and usage

- earth with clouds 3d model: nasa visualization technology applications and development (vtad), https://science.nasa.gov/resource/earth-with-clouds-3d-model/
- landsat 8 3d model: nasa/christopher r. meaney, https://science.nasa.gov/3d-resources/landsat-8/
- nasa media usage guidelines: https://www.nasa.gov/nasa-brand-center/images-and-media/

these nasa assets are used for an educational project. nasa should be acknowledged as their source. this project is independent and is **not endorsed, reviewed, or sponsored by nasa**. nasa names and logos must not be used as project branding. check the nasa guidelines again before public deployment or another use.

## project layout

- `client/`: react ui and the nasa model files
- `server/`: express api and postgres access
- `server/src/schema.js`: app schema setup
- `server/src/routes/auth.js`: account endpoints
- `server/src/routes/satellites.js`: satellite record endpoints

## api

- `post /api/auth/signup`
- `post /api/auth/login`
- `get /api/auth/me`
- `post /api/auth/logout`
- `get /api/satellites`
- `post /api/satellites`
- `patch /api/satellites/:id`
- `delete /api/satellites/:id`
- `post /api/satellites/sample`

## checks

run `npm test` for the api and coordinate tests and `npm run build` for the frontend build. the api tests use an in-memory postgres-compatible database and do not alter the supabase project.

## before the first git push

- [ ] confirm the supabase connection works, then keep the real `database_url` and `jwt_secret` in the ignored `server/.env` file and deployment secrets only.
- [ ] rotate the database password shared in chat before public deployment and update the local and deployment secrets.
- [ ] run `npm test` and `npm run build` after adding course features.

