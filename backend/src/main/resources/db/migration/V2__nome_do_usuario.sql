ALTER TABLE usuarios ADD COLUMN nome VARCHAR(120);
UPDATE usuarios SET nome = login WHERE nome IS NULL;
