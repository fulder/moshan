.PHONY: test
test:
	pip install -U -r test/unittest/requirements.txt
	PYTHONPATH=./src/layers/utils/python:./src/lambdas/:./src/layers/databases/python \
		pytest test/unittest --cov-report html --cov=src -vv

.PHONY: apitest
apitest:
	PYTHONPATH=test pytest test/apitest -vv