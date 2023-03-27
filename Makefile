.PHONY: test
test:
	poetry install --with pytest
	poetry run pytest test/unittest

.PHONY: apitest
apitest:
	poetry install --with pytest,dev
	PYTHONPATH=test poetry run pytest test/apitest -vv

.PHONY: deploy-provision
deploy-provision:
	sam deploy --template-file template_provision.yml --stack-name moshan-table

.PHONY: format
format:
	poetry install --with lint
	poetry run black .
	poetry run isort .
	poetry run flake8 .