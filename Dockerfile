FROM ruby:3.4-slim
WORKDIR /srv/jekyll
RUN apt-get update && apt-get install -y build-essential && rm -rf /var/lib/apt/lists/*
COPY Gemfile Gemfile.lock ./
RUN bundle install
EXPOSE 4000 35729
CMD ["bundle", "exec", "jekyll", "serve", "--host", "0.0.0.0", "--force_polling", "--livereload"]
