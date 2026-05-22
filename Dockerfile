# Use an official Node runtime as a parent image
FROM node:20-alpine AS build

# Set the working directory
WORKDIR /app

# Install app dependencies
COPY package.json .
COPY package-lock.json .
RUN npm install

# Bundle app source
COPY . .

# Build the app for production
FROM node:20-alpine AS production
WORKDIR /app
COPY --from=build /app .
CMD [ "npm", "start" ]
