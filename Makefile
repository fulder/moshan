.PHONY: test
test:
	pip install -U -r test/unittest/requirements.txt
	PYTHONPATH=./src/layers/utils/:./src/lambdas/:./src/layers/databases:./src/layers/api:./src/lambdas/api \
		pytest test/unittest --cov-report html --cov=src -vv

.PHONY: apitest
apitest:
	PYTHONPATH=test pytest test/apitest -vv

.PHONE: generate-hashes
generate-hashes:
	pip install pip-tools
	pip-compile --generate-hashes src/layers/api/requirements.in --output-file src/layers/api/requirements.txt
	pip-compile --generate-hashes src/layers/databases/requirements.in --output-file src/layers/databases/requirements.txt
	pip-compile --generate-hashes src/layers/utils/requirements.in --output-file src/layers/utils/requirements.txt
	pip-compile --generate-hashes src/lambdas/api/requirements.in --output-file src/lambdas/api/requirements.txt

.PHONY: deploy-provision
deploy-provision:
	sam deploy --template-file template_provision.yml --stack-name moshan-table