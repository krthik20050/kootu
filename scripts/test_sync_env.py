import contextlib
import io
import tempfile
import unittest
from pathlib import Path

from dotenv import dotenv_values
from sync_env import sync_environment


class EnvironmentSyncTests(unittest.TestCase):
    def fixture(self, root):
        (root / ".environment").mkdir()
        for folder in ("backend", "frontend", "database"):
            (root / folder).mkdir()
        (root / "backend/.env.example").write_text("GROQ_API_KEY=\nDATABASE_URL=\n")
        (root / "frontend/.env.example").write_text(
            "NEXT_PUBLIC_API_URL=\nCLERK_SECRET_KEY=\n"
        )
        (root / ".environment/.env").write_text(
            'GROQ_API_KEY="provider-secret"\nDATABASE_URL="runtime-secret"\n'
            'NEXT_PUBLIC_API_URL="https://api.example"\nCLERK_SECRET_KEY="clerk-secret"\n'
            'SUPABASE_DB_PASSWORD="owner-secret"\nSUPABASE_API_DB_PASSWORD="role-secret"\n'
            'SUPABASE_MIGRATION_DATABASE_URL="migration-secret"\n'
        )

    def test_scopes_secrets_and_hides_values(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            self.fixture(root)
            output = io.StringIO()
            with contextlib.redirect_stdout(output):
                sync_environment(root)
            frontend = dotenv_values(root / "frontend/.env.local")
            backend = dotenv_values(root / "backend/.env")
            self.assertNotIn("GROQ_API_KEY", frontend)
            self.assertNotIn("DATABASE_URL", frontend)
            self.assertNotIn("SUPABASE_DB_PASSWORD", backend)
            self.assertEqual(backend["GROQ_API_KEY"], "provider-secret")
            self.assertNotIn("secret", output.getvalue())

    def test_refuses_blank_overwrite_before_any_write(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            self.fixture(root)
            (root / "frontend/.env.local").write_text(
                'CLERK_SECRET_KEY="saved-secret"\n'
            )
            source = root / ".environment/.env"
            source.write_text(
                source.read_text().replace(
                    'CLERK_SECRET_KEY="clerk-secret"', 'CLERK_SECRET_KEY=""'
                )
            )
            with self.assertRaisesRegex(ValueError, "Refusing to clear"):
                sync_environment(root)
            self.assertFalse((root / "backend/.env").exists())
            self.assertEqual(
                dotenv_values(root / "frontend/.env.local")["CLERK_SECRET_KEY"],
                "saved-secret",
            )

    def test_duplicate_keys_fail_before_writing(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            self.fixture(root)
            source = root / ".environment/.env"
            source.write_text(source.read_text() + "GROQ_API_KEY=another-value\n")
            with self.assertRaisesRegex(ValueError, "duplicate"):
                sync_environment(root)
            self.assertFalse((root / "backend/.env").exists())


if __name__ == "__main__":
    unittest.main()
