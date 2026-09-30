# Dotted column name reproduction

`dotted-column.parquet` contains one synthetic row and one integer column:

| a.b |
| --- |
| 1 |

Open the file in Parquet Explorer and run the default `SELECT * FROM data` query.
The `a.b` cell is blank before the fix and displays `1` after the fix.

The file was generated entirely from a SQL literal. Run this in DuckDB from the
repository root to regenerate it:

```sql
COPY (SELECT 1 AS "a.b") TO 'test/fixtures/dotted-column.parquet'
  (FORMAT PARQUET, COMPRESSION UNCOMPRESSED);
```

It contains no real-world records or custom metadata.
