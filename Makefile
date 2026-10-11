.PHONY: test
test:
	uv run --group pytest --group lambda pytest test/unittest

.PHONY: apitest
apitest:
	PYTHONPATH=test uv run --group pytest pytest test/apitest -vv

.PHONY: deploy-provision
deploy-provision:
	sam deploy --template-file template_provision.yml --stack-name moshan-table

.PHONY: format
format:
	uv run --group lint black .
	uv run --group lint isort .
	uv run --group lint flake8 .