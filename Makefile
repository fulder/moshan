.PHONY: test
test:
	pytest test/unittest

.PHONY: apitest
apitest:
	PYTHONPATH=test pytest test/apitest -vv

.PHONE: generate-hashes
generate-hashes:
	pip install pip-tools
	find . -name "requirements*.in" -exec pip-compile --generate-hashes {} \;

.PHONY: deploy-provision
deploy-provision:
	sam deploy --template-file template_provision.yml --stack-name moshan-table