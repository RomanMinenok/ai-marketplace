# Postgres MCP

Postgres MCP надає Claude Code контрольований доступ до бази даних через Model Context Protocol.

За замовчуванням сервер працює в read-only режимі й вимагає явного allow-list таблиць. Жодних DDL/DML без окремого дозволу.
