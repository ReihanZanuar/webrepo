import { randomBytes } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
try {
  await writeFile(new URL('../.env',import.meta.url),`ADMIN_TOKEN=${randomBytes(32).toString('hex')}\nWEB_PORT=8080\nBIND_ADDRESS=127.0.0.1\n`,{flag:'wx',mode:0o600});
  console.log('.env dibuat. Kunci admin tersimpan di .env; file ini jangan dibagikan atau di-commit.');
} catch(error) {
  if(error.code==='EEXIST') console.log('.env sudah ada; tidak diubah.');
  else throw error;
}
