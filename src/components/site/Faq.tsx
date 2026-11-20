import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export type ItemFaq = { pergunta: string; resposta: string };

// Perguntas e respostas em acordeão (modelo 2). As respostas vêm sempre de dados reais.
export function Faq({ itens }: { itens: ItemFaq[] }) {
  return (
    <Accordion className="w-full">
      {itens.map((i) => (
        <AccordionItem key={i.pergunta} value={i.pergunta} className="border-foreground/15">
          <AccordionTrigger className="min-h-14 py-4 text-left text-base font-semibold">{i.pergunta}</AccordionTrigger>
          <AccordionContent className="text-base text-muted-foreground">{i.resposta}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
