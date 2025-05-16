# Best Practices per CRUD con React e TanStack Query

Questo documento raccoglie le migliori pratiche per implementare operazioni CRUD (Create, Read, Update, Delete) in applicazioni React utilizzando TanStack Query (React Query).

## Organizzazione dei Query

### 1. Struttura delle Query Keys

- **Usa array annidate** per chiavi gerarchiche per facilitare l'invalidazione:
  ```typescript
  // ✓ Buona pratica
  useQuery({ queryKey: ['branches', branchId], ... })
  
  // ✗ Da evitare
  useQuery({ queryKey: [`branches/${branchId}`], ... })
  ```

- **Standardizza la struttura delle chiavi** per facilitare manutenzione e invalidazione:
  ```typescript
  // Listing: ['entityName']
  // Detail: ['entityName', id]
  // Filtered: ['entityName', 'filters', filterParams]
  ```

### 2. Data Fetching

- **Centralizza la logica di fetching** in custom hooks per ogni entità:
  ```typescript
  // useBranches.ts
  export function useBranches() {
    return useQuery({
      queryKey: ['branches'],
      queryFn: () => fetch('/api/branches').then(res => res.json())
    });
  }
  
  export function useBranch(id: number) {
    return useQuery({
      queryKey: ['branches', id],
      queryFn: () => fetch(`/api/branches/${id}`).then(res => res.json()),
      enabled: !!id
    });
  }
  ```

- **Usa `enabled`** per queries condizionali che dipendono da altri dati:
  ```typescript
  const { data: branch } = useBranch(branchId);
  const { data: company } = useQuery({
    queryKey: ['companies', branch?.companyId],
    enabled: !!branch?.companyId
  });
  ```

## Mutazioni

### 1. Gestione della Cache

- **Invalidazione mirata della cache** dopo le mutazioni:
  ```typescript
  const queryClient = useQueryClient();
  
  const createBranch = useMutation({
    mutationFn: (newBranch) => fetch('/api/branches', {
      method: 'POST',
      body: JSON.stringify(newBranch)
    }).then(res => res.json()),
    onSuccess: () => {
      // Invalida solo le query di lista
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      
      // Aggiunge messaggi di feedback
      toast.success('Filiale creata con successo');
    }
  });
  ```

- **Aggiornamento ottimistico** per migliorare la UX:
  ```typescript
  const updateBranch = useMutation({
    mutationFn: (updatedBranch) => fetch(`/api/branches/${updatedBranch.id}`, {
      method: 'PUT',
      body: JSON.stringify(updatedBranch)
    }).then(res => res.json()),
    onMutate: async (updatedBranch) => {
      // Annulla le query in sospeso
      await queryClient.cancelQueries({ queryKey: ['branches', updatedBranch.id] });
      
      // Salva il valore precedente
      const previousBranch = queryClient.getQueryData(['branches', updatedBranch.id]);
      
      // Aggiorna ottimisticamente la cache
      queryClient.setQueryData(['branches', updatedBranch.id], updatedBranch);
      
      return { previousBranch };
    },
    onError: (err, updatedBranch, context) => {
      // Ripristina lo stato precedente in caso di errore
      queryClient.setQueryData(
        ['branches', updatedBranch.id],
        context?.previousBranch
      );
      toast.error('Errore durante l\'aggiornamento');
    },
    onSuccess: () => {
      toast.success('Filiale aggiornata con successo');
    },
    onSettled: (data, error, variables) => {
      // Invalida la cache per essere sicuri che sia aggiornata
      queryClient.invalidateQueries({ queryKey: ['branches', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['branches'] });
    }
  });
  ```

### 2. Gestione degli Errori

- **Usa `onError` callback** per gestire gli errori delle mutazioni:
  ```typescript
  const deleteBranch = useMutation({
    mutationFn: (id) => fetch(`/api/branches/${id}`, {
      method: 'DELETE'
    }),
    onError: (error) => {
      // Gestione specifica dell'errore
      if (error.response?.status === 403) {
        toast.error('Non hai i permessi per eliminare questa filiale');
      } else {
        toast.error('Errore durante l\'eliminazione');
      }
    }
  });
  ```

- **Implementa la riprova automatica** per le query:
  ```typescript
  useQuery({
    queryKey: ['branches'],
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  });
  ```

## UI e UX

### 1. Stati di Loading e Error

- **Mostra skeleton UI** durante il caricamento iniziale:
  ```tsx
  const { data: branches, isLoading, error } = useBranches();
  
  if (isLoading) {
    return <BranchesSkeleton />;
  }
  
  if (error) {
    return <ErrorDisplay error={error} />;
  }
  ```

- **Disabilita i pulsanti** durante l'esecuzione delle mutazioni:
  ```tsx
  const { mutate, isPending } = useCreateBranch();
  
  return (
    <Button 
      onClick={() => mutate(newBranch)} 
      disabled={isPending}
    >
      {isPending ? 'Salvataggio...' : 'Crea Filiale'}
    </Button>
  );
  ```

### 2. Form e Validazione

- **Integra React Hook Form con TanStack Query**:
  ```tsx
  const form = useForm({
    resolver: zodResolver(branchSchema),
    defaultValues: initialData || {
      name: '',
      address: '',
      // ...
    }
  });
  
  const { mutate, isPending } = useCreateBranch();
  
  const onSubmit = (data) => {
    mutate(data, {
      onSuccess: () => {
        form.reset();
        closeModal();
      }
    });
  };
  ```

## Paginazione e Filtri

### 1. Paginazione Efficiente

- **Usa `keepPreviousData`** per una migliore UX durante la paginazione:
  ```typescript
  const { data, isLoading, isPreviousData } = useQuery({
    queryKey: ['branches', 'page', page],
    keepPreviousData: true
  });
  
  // Disabilita il pulsante "Successivo" all'ultima pagina
  <Button 
    disabled={isPreviousData || page >= totalPages}
    onClick={() => setPage(old => old + 1)}
  >
    Successivo
  </Button>
  ```

### 2. Filtri e Ricerca

- **Usa `useDebounce`** per ridurre le chiamate API durante la ricerca:
  ```typescript
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  
  const { data } = useQuery({
    queryKey: ['branches', 'search', debouncedSearchTerm],
    enabled: debouncedSearchTerm.length > 2
  });
  ```

## Prefetching e Caching

### 1. Prefetching per Migliorare la UX

- **Precarica i dati** quando l'utente passa il mouse su un link:
  ```tsx
  <div 
    onMouseEnter={() => {
      queryClient.prefetchQuery({
        queryKey: ['branches', branch.id],
        queryFn: () => fetch(`/api/branches/${branch.id}`).then(res => res.json())
      });
    }}
  >
    <Link to={`/branches/${branch.id}`}>
      {branch.name}
    </Link>
  </div>
  ```

### 2. Configurazione della Cache

- **Imposta tempi di stale e cache** appropriati per ogni tipo di query:
  ```typescript
  // Dati che cambiano frequentemente
  useQuery({
    queryKey: ['activity'],
    staleTime: 30 * 1000, // 30 secondi
    cacheTime: 5 * 60 * 1000 // 5 minuti
  });
  
  // Dati che cambiano raramente
  useQuery({
    queryKey: ['references'],
    staleTime: 60 * 60 * 1000, // 1 ora
    cacheTime: 24 * 60 * 60 * 1000 // 1 giorno
  });
  ```

## Fonti e Riferimenti

- [TanStack Query Documentazione Ufficiale](https://tanstack.com/query/latest/docs/react/overview)
- [React Query Patterns - GitHub](https://github.com/TanStack/query/discussions/categories/patterns)
- [Common Mistakes in React Query - TkDodo's Blog](https://tkdodo.eu/blog/react-query-data-transformations)
- [React Query Best Practices on StackOverflow](https://stackoverflow.com/questions/tagged/react-query?tab=Votes)