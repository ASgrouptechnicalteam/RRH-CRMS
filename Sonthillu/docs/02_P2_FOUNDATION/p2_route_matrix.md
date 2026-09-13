# Route Matrix (P2)

| Route            | Expected | Current | P2 Action |
| ---------------- | -------- | ------- | --------- |
| `/`              | 200      | 200     | None      |
| `/about`         | 200      | 200     | None      |
| `/contact`       | 200      | 200     | None      |
| `/properties`    | 200      | 200     | None      |
| `/projects`      | 200      | 200     | None      |
| `/shortlist`     | 200/Auth | 200     | None      |
| `/compare`       | 200      | 200     | None      |
| `/login`         | 200      | 200     | None      |
| `/register`      | 200      | 200     | None      |
| `/account`       | 200/Auth | 200     | None      |
| `/sell-property` | 200      | 200     | None      |
| invalid route    | 404      | 404     | Update UI |
