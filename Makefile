#
# Utilities: A classic collection of JavaScript utilities
# Copyright 2112 Matthew Eernisse (mde@fleegix.org)
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#         http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

.PHONY: all build install clean uninstall

PREFIX=/usr/local
DESTDIR=

all: build

build:
	@echo 'Utilities built.'

install:
	@mkdir -p $(DESTDIR)$(PREFIX)/lib/node_modules/utilities && \
		cp -R ./* $(DESTDIR)$(PREFIX)/lib/node_modules/utilities/ && \
		echo 'Utilities installed.'

clean:
	@true

uninstall:
	@rm -rf $(DESTDIR)$(PREFIX)/lib/node_modules/utilities && \
		echo 'Utilities uninstalled.'

