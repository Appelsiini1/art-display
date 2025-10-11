FROM node:22

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install application dependencies
RUN npm install

# Copy the rest of your application's source code to the working directory
COPY . .

EXPOSE 9000

CMD [ "npm", "run", "start" ]