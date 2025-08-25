FROM nginx:latest

# Copy your website files to the NGINX web root
COPY sample-ci-cd/html/* /usr/share/nginx/html/

# Expose port 80, which NGINX listens on by default
EXPOSE 80

# Command to run NGINX in the foreground
CMD ["nginx", "-g", "daemon off;"]
