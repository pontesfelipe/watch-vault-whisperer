# Isolar o histórico de Collection Insights por coleção

## Problema confirmado
A página acrescenta todos os itens antigos do usuário que não têm coleção. Ao marcar um item como vendido, trocado, perdido, roubado ou doado, a coleção é apagada do registro. Não existe hoje um campo que preserve sua origem. Por isso, filtrar apenas por usuário — ou pelo tipo do item — não garante a separação entre coleções.

A consulta atual também não tem uma alternativa que recupere essa origem. Os quatro itens antigos encontrados estão sem coleção; nenhum tem especificações de tênis ou bolsa, mas isso não identifica a coleção original.

## Correção proposta
- Preservar automaticamente a coleção de origem quando um item é arquivado, mantendo a retirada da coleção atual e todo o histórico de uso.
- Em Collection Insights, carregar os itens ligados à coleção selecionada e apenas os itens antigos cuja origem seja essa mesma coleção, respeitando o acesso do usuário.
- Usar essa lista isolada tanto na linha do tempo quanto nos gastos totais e por ano. As abas de notas pessoais e garantia continuam mostrando somente itens ativos.
- Para registros já arquivados, recuperar a origem somente quando houver evidência inequívoca. Não atribuir por marca, aparência, tipo ou coleção padrão. Registros sem origem comprovada permanecem preservados, mas não entram nos totais de uma coleção específica.
- Impedir que uma resposta atrasada da coleção anterior reapareça depois de trocar de coleção.

## Detalhes técnicos
- Adicionar um campo de origem em `public.watches` e um gatilho de aplicação que copie o `collection_id` anterior ao arquivamento, cobrindo os fluxos de computador e celular sem depender de cada tela.
- Manter as permissões existentes; o novo campo não concede acesso a itens de outros usuários. Validar as políticas existentes antes de definir a consulta final.
- Atualizar `PersonalNotes.tsx` para consultar pela origem exata, sem a busca abrangente de itens antigos com `collection_id IS NULL`.
- Atualizar a regra de arquitetura em `AGENTS.md` para documentar o isolamento por origem.

## Verificação
- Testar uma coleção de relógios com itens ativos e vendidos, outra coleção de relógios e coleções de tênis e bolsas: nenhum item ou custo pode atravessar essas fronteiras.
- Testar os cinco estados de arquivamento, itens antigos sem origem comprovada e os totais anuais.
- Conferir no aplicativo autenticado a linha do tempo, os gastos e a troca de coleção, sem arquivar ou alterar itens reais durante os testes.
- Marcar somente o apontamento `acb64c2c-086c-587d-b5a1-38ffaca19678` como corrigido após verificar a implementação.
