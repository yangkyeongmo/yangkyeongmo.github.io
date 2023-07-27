ENV=development
install:
	bundle install
build:
	JEKYLL_ENV=$(ENV) bundle exec jekyll build
serve:
	JEKYLL_ENV=$(ENV) bundle exec jekyll serve