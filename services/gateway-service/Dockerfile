FROM node:18-alpine
WORKDIR /app

# Install curl for healthcheck probing
RUN apk add --no-cache curl

# Copy only the files this service needs + the shared common folder
# Copy service package.json
COPY services/gateway-service/package.json ./package.json

# Copy the build-specific tsconfig
COPY tsconfig.base.json ./tsconfig.base.json
COPY tsconfig.build.json ./tsconfig.json

# Copy common and src
COPY services/common ./common
COPY services/gateway-service/src ./src

RUN npm install
RUN npm run build
EXPOSE 3003
CMD ["node", "src/index.js"]
