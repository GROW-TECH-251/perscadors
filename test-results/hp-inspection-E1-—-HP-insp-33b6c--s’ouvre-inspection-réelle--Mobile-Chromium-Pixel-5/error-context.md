# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: hp-inspection.spec.ts >> E1 — HP inspection (page /looks) >> clic sur une pièce -> la fiche produit s’ouvre (inspection réelle)
- Location: tests\e2e\hp-inspection.spec.ts:16:7

# Error details

```
TimeoutError: page.waitForURL: Timeout 15000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
============================================================
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e2]:
    - navigation [ref=e3]:
      - generic [ref=e4]:
        - link [ref=e5] [cursor=pointer]:
          - /url: /
          - img "HP Collection Logo" [ref=e6]
        - generic [ref=e7]:
          - generic:
            - generic:
              - textbox "Rechercher..."
              - button "Valider la recherche"
          - button "Ouvrir la barre de recherche" [ref=e8]
          - button "Panier d'achat" [ref=e12]
          - button "Menu principal de navigation" [ref=e16]
    - generic [ref=e19]:
      - generic [ref=e20]:
        - link "Retour à l'accueil" [ref=e21] [cursor=pointer]:
          - /url: /
        - generic [ref=e24]: 31 Looks de Vioutou
      - generic [ref=e25]:
        - heading "HP Looks de Vioutou" [level=1] [ref=e26]
        - paragraph [ref=e28]: Tous les outfits streetwear les plus stylés du Bénin. Trouve le look complet qui te correspond et recrée-le instantanément.
      - generic [ref=e29]:
        - generic [ref=e30]:
          - generic [ref=e31]:
            - 'img "Signature HP Drip (Look #29)" [ref=e32]'
            - generic [ref=e33]: Vioutou Outfit 🔥
          - generic [ref=e34]:
            - generic [ref=e35]:
              - 'heading "Signature HP Drip (Look #29)" [level=3] [ref=e36]'
              - paragraph [ref=e37]: "Pièces de cet outfit :"
              - generic [ref=e38]:
                - link "Basket Streetwear Classic Black & White Basket Streetwear Classic Black & White basket pour homme 22,000 FCFA" [ref=e39] [cursor=pointer]:
                  - /url: /produit/1
                  - img "Basket Streetwear Classic Black & White" [ref=e41]
                  - generic [ref=e42]:
                    - heading "Basket Streetwear Classic Black & White" [level=4] [ref=e43]
                    - generic [ref=e44]: basket pour homme
                  - generic [ref=e45]: 22,000 FCFA
                - link "Jean Baggy Destroyed Vintage Jean Baggy Destroyed Vintage jean overside pour homme 19,000 FCFA" [ref=e46] [cursor=pointer]:
                  - /url: /produit/12
                  - img "Jean Baggy Destroyed Vintage" [ref=e48]
                  - generic [ref=e49]:
                    - heading "Jean Baggy Destroyed Vintage" [level=4] [ref=e50]
                    - generic [ref=e51]: jean overside pour homme
                  - generic [ref=e52]: 19,000 FCFA
                - link "Casquette Trucker Noir & Rose Casquette Trucker Noir & Rose accessoires 8,500 FCFA" [ref=e53] [cursor=pointer]:
                  - /url: /produit/36
                  - img "Casquette Trucker Noir & Rose" [ref=e55]
                  - generic [ref=e56]:
                    - heading "Casquette Trucker Noir & Rose" [level=4] [ref=e57]
                    - generic [ref=e58]: accessoires
                  - generic [ref=e59]: 8,500 FCFA
            - generic [ref=e60]:
              - generic [ref=e61]:
                - generic [ref=e62]: Total du Look
                - generic [ref=e63]: 49,500 FCFA
              - button "Recréer ce look" [ref=e64] [cursor=pointer]
        - generic [ref=e68]:
          - generic [ref=e69]:
            - 'img "Street Silhouette (Look #24)" [ref=e70]'
            - generic [ref=e71]: Vioutou Outfit 🔥
          - generic [ref=e72]:
            - generic [ref=e73]:
              - 'heading "Street Silhouette (Look #24)" [level=3] [ref=e74]'
              - paragraph [ref=e75]: "Pièces de cet outfit :"
              - generic [ref=e76]:
                - link "Basket Urban Luxe Gold Basket Urban Luxe Gold basket pour homme 24,500 FCFA" [ref=e77] [cursor=pointer]:
                  - /url: /produit/2
                  - img "Basket Urban Luxe Gold" [ref=e79]
                  - generic [ref=e80]:
                    - heading "Basket Urban Luxe Gold" [level=4] [ref=e81]
                    - generic [ref=e82]: basket pour homme
                  - generic [ref=e83]: 24,500 FCFA
                - link "Basket Streetwear Classic Black & White Basket Streetwear Classic Black & White basket pour homme 22,000 FCFA" [ref=e84] [cursor=pointer]:
                  - /url: /produit/1
                  - img "Basket Streetwear Classic Black & White" [ref=e86]
                  - generic [ref=e87]:
                    - heading "Basket Streetwear Classic Black & White" [level=4] [ref=e88]
                    - generic [ref=e89]: basket pour homme
                  - generic [ref=e90]: 22,000 FCFA
                - link "Sneaker High Top Noir Intense Sneaker High Top Noir Intense basket pour homme 25,000 FCFA" [ref=e91] [cursor=pointer]:
                  - /url: /produit/4
                  - img "Sneaker High Top Noir Intense" [ref=e93]
                  - generic [ref=e94]:
                    - heading "Sneaker High Top Noir Intense" [level=4] [ref=e95]
                    - generic [ref=e96]: basket pour homme
                  - generic [ref=e97]: 25,000 FCFA
            - generic [ref=e98]:
              - generic [ref=e99]:
                - generic [ref=e100]: Total du Look
                - generic [ref=e101]: 71,500 FCFA
              - button "Recréer ce look" [ref=e102] [cursor=pointer]
        - generic [ref=e106]:
          - generic [ref=e107]:
            - 'img "High Top Classic (Look #25)" [ref=e108]'
            - generic [ref=e109]: Vioutou Outfit 🔥
          - generic [ref=e110]:
            - generic [ref=e111]:
              - 'heading "High Top Classic (Look #25)" [level=3] [ref=e112]'
              - paragraph [ref=e113]: "Pièces de cet outfit :"
              - generic [ref=e114]:
                - link "Basket Streetwear Classic Black & White Basket Streetwear Classic Black & White basket pour homme 22,000 FCFA" [ref=e115] [cursor=pointer]:
                  - /url: /produit/1
                  - img "Basket Streetwear Classic Black & White" [ref=e117]
                  - generic [ref=e118]:
                    - heading "Basket Streetwear Classic Black & White" [level=4] [ref=e119]
                    - generic [ref=e120]: basket pour homme
                  - generic [ref=e121]: 22,000 FCFA
                - link "Basket Urban Luxe Gold Basket Urban Luxe Gold basket pour homme 24,500 FCFA" [ref=e122] [cursor=pointer]:
                  - /url: /produit/2
                  - img "Basket Urban Luxe Gold" [ref=e124]
                  - generic [ref=e125]:
                    - heading "Basket Urban Luxe Gold" [level=4] [ref=e126]
                    - generic [ref=e127]: basket pour homme
                  - generic [ref=e128]: 24,500 FCFA
            - generic [ref=e129]:
              - generic [ref=e130]:
                - generic [ref=e131]: Total du Look
                - generic [ref=e132]: 46,500 FCFA
              - button "Recréer ce look" [ref=e133] [cursor=pointer]
        - generic [ref=e137]:
          - generic [ref=e138]:
            - 'img "Cargo Explorer (Look #26)" [ref=e139]'
            - generic [ref=e140]: Vioutou Outfit 🔥
          - generic [ref=e141]:
            - generic [ref=e142]:
              - 'heading "Cargo Explorer (Look #26)" [level=3] [ref=e143]'
              - paragraph [ref=e144]: "Pièces de cet outfit :"
              - generic [ref=e145]:
                - link "Runner Sport Premium White Runner Sport Premium White basket pour homme 19,500 FCFA" [ref=e146] [cursor=pointer]:
                  - /url: /produit/3
                  - img "Runner Sport Premium White" [ref=e148]
                  - generic [ref=e149]:
                    - heading "Runner Sport Premium White" [level=4] [ref=e150]
                    - generic [ref=e151]: basket pour homme
                  - generic [ref=e152]: 19,500 FCFA
                - link "Basket Urban Luxe Gold Basket Urban Luxe Gold basket pour homme 24,500 FCFA" [ref=e153] [cursor=pointer]:
                  - /url: /produit/2
                  - img "Basket Urban Luxe Gold" [ref=e155]
                  - generic [ref=e156]:
                    - heading "Basket Urban Luxe Gold" [level=4] [ref=e157]
                    - generic [ref=e158]: basket pour homme
                  - generic [ref=e159]: 24,500 FCFA
                - link "Sneaker High Top Noir Intense Sneaker High Top Noir Intense basket pour homme 25,000 FCFA" [ref=e160] [cursor=pointer]:
                  - /url: /produit/4
                  - img "Sneaker High Top Noir Intense" [ref=e162]
                  - generic [ref=e163]:
                    - heading "Sneaker High Top Noir Intense" [level=4] [ref=e164]
                    - generic [ref=e165]: basket pour homme
                  - generic [ref=e166]: 25,000 FCFA
            - generic [ref=e167]:
              - generic [ref=e168]:
                - generic [ref=e169]: Total du Look
                - generic [ref=e170]: 69,000 FCFA
              - button "Recréer ce look" [ref=e171] [cursor=pointer]
        - generic [ref=e175]:
          - generic [ref=e176]:
            - 'img "Monochrome Hype (Look #27)" [ref=e177]'
            - generic [ref=e178]: Vioutou Outfit 🔥
          - generic [ref=e179]:
            - generic [ref=e180]:
              - 'heading "Monochrome Hype (Look #27)" [level=3] [ref=e181]'
              - paragraph [ref=e182]: "Pièces de cet outfit :"
              - generic [ref=e183]:
                - link "Retro Trainer Multi-Color Retro Trainer Multi-Color basket pour homme 18,000 FCFA" [ref=e184] [cursor=pointer]:
                  - /url: /produit/5
                  - img "Retro Trainer Multi-Color" [ref=e186]
                  - generic [ref=e187]:
                    - heading "Retro Trainer Multi-Color" [level=4] [ref=e188]
                    - generic [ref=e189]: basket pour homme
                  - generic [ref=e190]: 18,000 FCFA
                - link "Runner Sport Premium White Runner Sport Premium White basket pour homme 19,500 FCFA" [ref=e191] [cursor=pointer]:
                  - /url: /produit/3
                  - img "Runner Sport Premium White" [ref=e193]
                  - generic [ref=e194]:
                    - heading "Runner Sport Premium White" [level=4] [ref=e195]
                    - generic [ref=e196]: basket pour homme
                  - generic [ref=e197]: 19,500 FCFA
                - link "Basket Streetwear Classic Black & White Basket Streetwear Classic Black & White basket pour homme 22,000 FCFA" [ref=e198] [cursor=pointer]:
                  - /url: /produit/1
                  - img "Basket Streetwear Classic Black & White" [ref=e200]
                  - generic [ref=e201]:
                    - heading "Basket Streetwear Classic Black & White" [level=4] [ref=e202]
                    - generic [ref=e203]: basket pour homme
                  - generic [ref=e204]: 22,000 FCFA
            - generic [ref=e205]:
              - generic [ref=e206]:
                - generic [ref=e207]: Total du Look
                - generic [ref=e208]: 59,500 FCFA
              - button "Recréer ce look" [ref=e209] [cursor=pointer]
        - generic [ref=e213]:
          - generic [ref=e214]:
            - 'img "Luxe Cozy Day (Look #28)" [ref=e215]'
            - generic [ref=e216]: Vioutou Outfit 🔥
          - generic [ref=e217]:
            - generic [ref=e218]:
              - 'heading "Luxe Cozy Day (Look #28)" [level=3] [ref=e219]'
              - paragraph [ref=e220]: "Pièces de cet outfit :"
              - generic [ref=e221]:
                - link "Basket Urban Luxe Gold Basket Urban Luxe Gold basket pour homme 24,500 FCFA" [ref=e222] [cursor=pointer]:
                  - /url: /produit/2
                  - img "Basket Urban Luxe Gold" [ref=e224]
                  - generic [ref=e225]:
                    - heading "Basket Urban Luxe Gold" [level=4] [ref=e226]
                    - generic [ref=e227]: basket pour homme
                  - generic [ref=e228]: 24,500 FCFA
                - link "Basket Streetwear Classic Black & White Basket Streetwear Classic Black & White basket pour homme 22,000 FCFA" [ref=e229] [cursor=pointer]:
                  - /url: /produit/1
                  - img "Basket Streetwear Classic Black & White" [ref=e231]
                  - generic [ref=e232]:
                    - heading "Basket Streetwear Classic Black & White" [level=4] [ref=e233]
                    - generic [ref=e234]: basket pour homme
                  - generic [ref=e235]: 22,000 FCFA
                - link "Sneaker High Top Noir Intense Sneaker High Top Noir Intense basket pour homme 25,000 FCFA" [ref=e236] [cursor=pointer]:
                  - /url: /produit/4
                  - img "Sneaker High Top Noir Intense" [ref=e238]
                  - generic [ref=e239]:
                    - heading "Sneaker High Top Noir Intense" [level=4] [ref=e240]
                    - generic [ref=e241]: basket pour homme
                  - generic [ref=e242]: 25,000 FCFA
            - generic [ref=e243]:
              - generic [ref=e244]:
                - generic [ref=e245]: Total du Look
                - generic [ref=e246]: 71,500 FCFA
              - button "Recréer ce look" [ref=e247] [cursor=pointer]
        - generic [ref=e251]:
          - generic [ref=e252]:
            - 'img "Elegance & Flow (Look #30)" [ref=e253]'
            - generic [ref=e254]: Vioutou Outfit 🔥
          - generic [ref=e255]:
            - generic [ref=e256]:
              - 'heading "Elegance & Flow (Look #30)" [level=3] [ref=e257]'
              - paragraph [ref=e258]: "Pièces de cet outfit :"
              - generic [ref=e259]:
                - link "Runner Sport Premium White Runner Sport Premium White basket pour homme 19,500 FCFA" [ref=e260] [cursor=pointer]:
                  - /url: /produit/3
                  - img "Runner Sport Premium White" [ref=e262]
                  - generic [ref=e263]:
                    - heading "Runner Sport Premium White" [level=4] [ref=e264]
                    - generic [ref=e265]: basket pour homme
                  - generic [ref=e266]: 19,500 FCFA
                - link "Basket Urban Luxe Gold Basket Urban Luxe Gold basket pour homme 24,500 FCFA" [ref=e267] [cursor=pointer]:
                  - /url: /produit/2
                  - img "Basket Urban Luxe Gold" [ref=e269]
                  - generic [ref=e270]:
                    - heading "Basket Urban Luxe Gold" [level=4] [ref=e271]
                    - generic [ref=e272]: basket pour homme
                  - generic [ref=e273]: 24,500 FCFA
                - link "Sneaker High Top Noir Intense Sneaker High Top Noir Intense basket pour homme 25,000 FCFA" [ref=e274] [cursor=pointer]:
                  - /url: /produit/4
                  - img "Sneaker High Top Noir Intense" [ref=e276]
                  - generic [ref=e277]:
                    - heading "Sneaker High Top Noir Intense" [level=4] [ref=e278]
                    - generic [ref=e279]: basket pour homme
                  - generic [ref=e280]: 25,000 FCFA
            - generic [ref=e281]:
              - generic [ref=e282]:
                - generic [ref=e283]: Total du Look
                - generic [ref=e284]: 69,000 FCFA
              - button "Recréer ce look" [ref=e285] [cursor=pointer]
        - generic [ref=e289]:
          - generic [ref=e290]:
            - 'img "Streetwear Heritage (Look #31)" [ref=e291]'
            - generic [ref=e292]: Vioutou Outfit 🔥
          - generic [ref=e293]:
            - generic [ref=e294]:
              - 'heading "Streetwear Heritage (Look #31)" [level=3] [ref=e295]'
              - paragraph [ref=e296]: "Pièces de cet outfit :"
              - generic [ref=e297]:
                - link "Retro Trainer Multi-Color Retro Trainer Multi-Color basket pour homme 18,000 FCFA" [ref=e298] [cursor=pointer]:
                  - /url: /produit/5
                  - img "Retro Trainer Multi-Color" [ref=e300]
                  - generic [ref=e301]:
                    - heading "Retro Trainer Multi-Color" [level=4] [ref=e302]
                    - generic [ref=e303]: basket pour homme
                  - generic [ref=e304]: 18,000 FCFA
                - link "Runner Sport Premium White Runner Sport Premium White basket pour homme 19,500 FCFA" [ref=e305] [cursor=pointer]:
                  - /url: /produit/3
                  - img "Runner Sport Premium White" [ref=e307]
                  - generic [ref=e308]:
                    - heading "Runner Sport Premium White" [level=4] [ref=e309]
                    - generic [ref=e310]: basket pour homme
                  - generic [ref=e311]: 19,500 FCFA
                - link "Basket Streetwear Classic Black & White Basket Streetwear Classic Black & White basket pour homme 22,000 FCFA" [ref=e312] [cursor=pointer]:
                  - /url: /produit/1
                  - img "Basket Streetwear Classic Black & White" [ref=e314]
                  - generic [ref=e315]:
                    - heading "Basket Streetwear Classic Black & White" [level=4] [ref=e316]
                    - generic [ref=e317]: basket pour homme
                  - generic [ref=e318]: 22,000 FCFA
            - generic [ref=e319]:
              - generic [ref=e320]:
                - generic [ref=e321]: Total du Look
                - generic [ref=e322]: 59,500 FCFA
              - button "Recréer ce look" [ref=e323] [cursor=pointer]
        - generic [ref=e327]:
          - generic [ref=e328]:
            - 'img "Urban Legend (Look #32)" [ref=e329]'
            - generic [ref=e330]: Vioutou Outfit 🔥
          - generic [ref=e331]:
            - generic [ref=e332]:
              - 'heading "Urban Legend (Look #32)" [level=3] [ref=e333]'
              - paragraph [ref=e334]: "Pièces de cet outfit :"
              - generic [ref=e335]:
                - link "Basket Urban Luxe Gold Basket Urban Luxe Gold basket pour homme 24,500 FCFA" [ref=e336] [cursor=pointer]:
                  - /url: /produit/2
                  - img "Basket Urban Luxe Gold" [ref=e338]
                  - generic [ref=e339]:
                    - heading "Basket Urban Luxe Gold" [level=4] [ref=e340]
                    - generic [ref=e341]: basket pour homme
                  - generic [ref=e342]: 24,500 FCFA
                - link "Basket Streetwear Classic Black & White Basket Streetwear Classic Black & White basket pour homme 22,000 FCFA" [ref=e343] [cursor=pointer]:
                  - /url: /produit/1
                  - img "Basket Streetwear Classic Black & White" [ref=e345]
                  - generic [ref=e346]:
                    - heading "Basket Streetwear Classic Black & White" [level=4] [ref=e347]
                    - generic [ref=e348]: basket pour homme
                  - generic [ref=e349]: 22,000 FCFA
                - link "Sneaker High Top Noir Intense Sneaker High Top Noir Intense basket pour homme 25,000 FCFA" [ref=e350] [cursor=pointer]:
                  - /url: /produit/4
                  - img "Sneaker High Top Noir Intense" [ref=e352]
                  - generic [ref=e353]:
                    - heading "Sneaker High Top Noir Intense" [level=4] [ref=e354]
                    - generic [ref=e355]: basket pour homme
                  - generic [ref=e356]: 25,000 FCFA
            - generic [ref=e357]:
              - generic [ref=e358]:
                - generic [ref=e359]: Total du Look
                - generic [ref=e360]: 71,500 FCFA
              - button "Recréer ce look" [ref=e361] [cursor=pointer]
        - generic [ref=e365]:
          - generic [ref=e366]:
            - 'img "Summer Suede Vibe (Look #23)" [ref=e367]'
            - generic [ref=e368]: Vioutou Outfit 🔥
          - generic [ref=e369]:
            - generic [ref=e370]:
              - 'heading "Summer Suede Vibe (Look #23)" [level=3] [ref=e371]'
              - paragraph [ref=e372]: "Pièces de cet outfit :"
              - generic [ref=e373]:
                - link "Retro Trainer Multi-Color Retro Trainer Multi-Color basket pour homme 18,000 FCFA" [ref=e374] [cursor=pointer]:
                  - /url: /produit/5
                  - img "Retro Trainer Multi-Color" [ref=e376]
                  - generic [ref=e377]:
                    - heading "Retro Trainer Multi-Color" [level=4] [ref=e378]
                    - generic [ref=e379]: basket pour homme
                  - generic [ref=e380]: 18,000 FCFA
                - link "Runner Sport Premium White Runner Sport Premium White basket pour homme 19,500 FCFA" [ref=e381] [cursor=pointer]:
                  - /url: /produit/3
                  - img "Runner Sport Premium White" [ref=e383]
                  - generic [ref=e384]:
                    - heading "Runner Sport Premium White" [level=4] [ref=e385]
                    - generic [ref=e386]: basket pour homme
                  - generic [ref=e387]: 19,500 FCFA
                - link "Basket Streetwear Classic Black & White Basket Streetwear Classic Black & White basket pour homme 22,000 FCFA" [ref=e388] [cursor=pointer]:
                  - /url: /produit/1
                  - img "Basket Streetwear Classic Black & White" [ref=e390]
                  - generic [ref=e391]:
                    - heading "Basket Streetwear Classic Black & White" [level=4] [ref=e392]
                    - generic [ref=e393]: basket pour homme
                  - generic [ref=e394]: 22,000 FCFA
            - generic [ref=e395]:
              - generic [ref=e396]:
                - generic [ref=e397]: Total du Look
                - generic [ref=e398]: 59,500 FCFA
              - button "Recréer ce look" [ref=e399] [cursor=pointer]
        - generic [ref=e403]:
          - generic [ref=e404]:
            - 'img "Shadow Black Street (Look #13)" [ref=e405]'
            - generic [ref=e406]: Vioutou Outfit 🔥
          - generic [ref=e407]:
            - generic [ref=e408]:
              - 'heading "Shadow Black Street (Look #13)" [level=3] [ref=e409]'
              - paragraph [ref=e410]: "Pièces de cet outfit :"
              - generic [ref=e411]:
                - link "Basket Streetwear Classic Black & White Basket Streetwear Classic Black & White basket pour homme 22,000 FCFA" [ref=e412] [cursor=pointer]:
                  - /url: /produit/1
                  - img "Basket Streetwear Classic Black & White" [ref=e414]
                  - generic [ref=e415]:
                    - heading "Basket Streetwear Classic Black & White" [level=4] [ref=e416]
                    - generic [ref=e417]: basket pour homme
                  - generic [ref=e418]: 22,000 FCFA
                - link "Basket Urban Luxe Gold Basket Urban Luxe Gold basket pour homme 24,500 FCFA" [ref=e419] [cursor=pointer]:
                  - /url: /produit/2
                  - img "Basket Urban Luxe Gold" [ref=e421]
                  - generic [ref=e422]:
                    - heading "Basket Urban Luxe Gold" [level=4] [ref=e423]
                    - generic [ref=e424]: basket pour homme
                  - generic [ref=e425]: 24,500 FCFA
            - generic [ref=e426]:
              - generic [ref=e427]:
                - generic [ref=e428]: Total du Look
                - generic [ref=e429]: 46,500 FCFA
              - button "Recréer ce look" [ref=e430] [cursor=pointer]
        - generic [ref=e434]:
          - generic [ref=e435]:
            - 'img "Retro Hype Style (Look #14)" [ref=e436]'
            - generic [ref=e437]: Vioutou Outfit 🔥
          - generic [ref=e438]:
            - generic [ref=e439]:
              - 'heading "Retro Hype Style (Look #14)" [level=3] [ref=e440]'
              - paragraph [ref=e441]: "Pièces de cet outfit :"
              - generic [ref=e442]:
                - link "Runner Sport Premium White Runner Sport Premium White basket pour homme 19,500 FCFA" [ref=e443] [cursor=pointer]:
                  - /url: /produit/3
                  - img "Runner Sport Premium White" [ref=e445]
                  - generic [ref=e446]:
                    - heading "Runner Sport Premium White" [level=4] [ref=e447]
                    - generic [ref=e448]: basket pour homme
                  - generic [ref=e449]: 19,500 FCFA
                - link "Basket Urban Luxe Gold Basket Urban Luxe Gold basket pour homme 24,500 FCFA" [ref=e450] [cursor=pointer]:
                  - /url: /produit/2
                  - img "Basket Urban Luxe Gold" [ref=e452]
                  - generic [ref=e453]:
                    - heading "Basket Urban Luxe Gold" [level=4] [ref=e454]
                    - generic [ref=e455]: basket pour homme
                  - generic [ref=e456]: 24,500 FCFA
                - link "Sneaker High Top Noir Intense Sneaker High Top Noir Intense basket pour homme 25,000 FCFA" [ref=e457] [cursor=pointer]:
                  - /url: /produit/4
                  - img "Sneaker High Top Noir Intense" [ref=e459]
                  - generic [ref=e460]:
                    - heading "Sneaker High Top Noir Intense" [level=4] [ref=e461]
                    - generic [ref=e462]: basket pour homme
                  - generic [ref=e463]: 25,000 FCFA
            - generic [ref=e464]:
              - generic [ref=e465]:
                - generic [ref=e466]: Total du Look
                - generic [ref=e467]: 69,000 FCFA
              - button "Recréer ce look" [ref=e468] [cursor=pointer]
        - generic [ref=e472]:
          - generic [ref=e473]:
            - 'img "Golden Hour Glow (Look #17)" [ref=e474]'
            - generic [ref=e475]: Vioutou Outfit 🔥
          - generic [ref=e476]:
            - generic [ref=e477]:
              - 'heading "Golden Hour Glow (Look #17)" [level=3] [ref=e478]'
              - paragraph [ref=e479]: "Pièces de cet outfit :"
              - generic [ref=e480]:
                - link "Basket Streetwear Classic Black & White Basket Streetwear Classic Black & White basket pour homme 22,000 FCFA" [ref=e481] [cursor=pointer]:
                  - /url: /produit/1
                  - img "Basket Streetwear Classic Black & White" [ref=e483]
                  - generic [ref=e484]:
                    - heading "Basket Streetwear Classic Black & White" [level=4] [ref=e485]
                    - generic [ref=e486]: basket pour homme
                  - generic [ref=e487]: 22,000 FCFA
                - link "Basket Urban Luxe Gold Basket Urban Luxe Gold basket pour homme 24,500 FCFA" [ref=e488] [cursor=pointer]:
                  - /url: /produit/2
                  - img "Basket Urban Luxe Gold" [ref=e490]
                  - generic [ref=e491]:
                    - heading "Basket Urban Luxe Gold" [level=4] [ref=e492]
                    - generic [ref=e493]: basket pour homme
                  - generic [ref=e494]: 24,500 FCFA
            - generic [ref=e495]:
              - generic [ref=e496]:
                - generic [ref=e497]: Total du Look
                - generic [ref=e498]: 46,500 FCFA
              - button "Recréer ce look" [ref=e499] [cursor=pointer]
        - generic [ref=e503]:
          - generic [ref=e504]:
            - 'img "VIP Influencer Look (Look #18)" [ref=e505]'
            - generic [ref=e506]: Vioutou Outfit 🔥
          - generic [ref=e507]:
            - generic [ref=e508]:
              - 'heading "VIP Influencer Look (Look #18)" [level=3] [ref=e509]'
              - paragraph [ref=e510]: "Pièces de cet outfit :"
              - generic [ref=e511]:
                - link "Runner Sport Premium White Runner Sport Premium White basket pour homme 19,500 FCFA" [ref=e512] [cursor=pointer]:
                  - /url: /produit/3
                  - img "Runner Sport Premium White" [ref=e514]
                  - generic [ref=e515]:
                    - heading "Runner Sport Premium White" [level=4] [ref=e516]
                    - generic [ref=e517]: basket pour homme
                  - generic [ref=e518]: 19,500 FCFA
                - link "Basket Urban Luxe Gold Basket Urban Luxe Gold basket pour homme 24,500 FCFA" [ref=e519] [cursor=pointer]:
                  - /url: /produit/2
                  - img "Basket Urban Luxe Gold" [ref=e521]
                  - generic [ref=e522]:
                    - heading "Basket Urban Luxe Gold" [level=4] [ref=e523]
                    - generic [ref=e524]: basket pour homme
                  - generic [ref=e525]: 24,500 FCFA
                - link "Sneaker High Top Noir Intense Sneaker High Top Noir Intense basket pour homme 25,000 FCFA" [ref=e526] [cursor=pointer]:
                  - /url: /produit/4
                  - img "Sneaker High Top Noir Intense" [ref=e528]
                  - generic [ref=e529]:
                    - heading "Sneaker High Top Noir Intense" [level=4] [ref=e530]
                    - generic [ref=e531]: basket pour homme
                  - generic [ref=e532]: 25,000 FCFA
            - generic [ref=e533]:
              - generic [ref=e534]:
                - generic [ref=e535]: Total du Look
                - generic [ref=e536]: 69,000 FCFA
              - button "Recréer ce look" [ref=e537] [cursor=pointer]
        - generic [ref=e541]:
          - generic [ref=e542]:
            - 'img "Clean Slate White (Look #19)" [ref=e543]'
            - generic [ref=e544]: Vioutou Outfit 🔥
          - generic [ref=e545]:
            - generic [ref=e546]:
              - 'heading "Clean Slate White (Look #19)" [level=3] [ref=e547]'
              - paragraph [ref=e548]: "Pièces de cet outfit :"
              - generic [ref=e549]:
                - link "Retro Trainer Multi-Color Retro Trainer Multi-Color basket pour homme 18,000 FCFA" [ref=e550] [cursor=pointer]:
                  - /url: /produit/5
                  - img "Retro Trainer Multi-Color" [ref=e552]
                  - generic [ref=e553]:
                    - heading "Retro Trainer Multi-Color" [level=4] [ref=e554]
                    - generic [ref=e555]: basket pour homme
                  - generic [ref=e556]: 18,000 FCFA
                - link "Runner Sport Premium White Runner Sport Premium White basket pour homme 19,500 FCFA" [ref=e557] [cursor=pointer]:
                  - /url: /produit/3
                  - img "Runner Sport Premium White" [ref=e559]
                  - generic [ref=e560]:
                    - heading "Runner Sport Premium White" [level=4] [ref=e561]
                    - generic [ref=e562]: basket pour homme
                  - generic [ref=e563]: 19,500 FCFA
                - link "Basket Streetwear Classic Black & White Basket Streetwear Classic Black & White basket pour homme 22,000 FCFA" [ref=e564] [cursor=pointer]:
                  - /url: /produit/1
                  - img "Basket Streetwear Classic Black & White" [ref=e566]
                  - generic [ref=e567]:
                    - heading "Basket Streetwear Classic Black & White" [level=4] [ref=e568]
                    - generic [ref=e569]: basket pour homme
                  - generic [ref=e570]: 22,000 FCFA
            - generic [ref=e571]:
              - generic [ref=e572]:
                - generic [ref=e573]: Total du Look
                - generic [ref=e574]: 59,500 FCFA
              - button "Recréer ce look" [ref=e575] [cursor=pointer]
        - generic [ref=e579]:
          - generic [ref=e580]:
            - 'img "Heavy Cotton Comfort (Look #20)" [ref=e581]'
            - generic [ref=e582]: Vioutou Outfit 🔥
          - generic [ref=e583]:
            - generic [ref=e584]:
              - 'heading "Heavy Cotton Comfort (Look #20)" [level=3] [ref=e585]'
              - paragraph [ref=e586]: "Pièces de cet outfit :"
              - generic [ref=e587]:
                - link "Basket Urban Luxe Gold Basket Urban Luxe Gold basket pour homme 24,500 FCFA" [ref=e588] [cursor=pointer]:
                  - /url: /produit/2
                  - img "Basket Urban Luxe Gold" [ref=e590]
                  - generic [ref=e591]:
                    - heading "Basket Urban Luxe Gold" [level=4] [ref=e592]
                    - generic [ref=e593]: basket pour homme
                  - generic [ref=e594]: 24,500 FCFA
                - link "Basket Streetwear Classic Black & White Basket Streetwear Classic Black & White basket pour homme 22,000 FCFA" [ref=e595] [cursor=pointer]:
                  - /url: /produit/1
                  - img "Basket Streetwear Classic Black & White" [ref=e597]
                  - generic [ref=e598]:
                    - heading "Basket Streetwear Classic Black & White" [level=4] [ref=e599]
                    - generic [ref=e600]: basket pour homme
                  - generic [ref=e601]: 22,000 FCFA
                - link "Sneaker High Top Noir Intense Sneaker High Top Noir Intense basket pour homme 25,000 FCFA" [ref=e602] [cursor=pointer]:
                  - /url: /produit/4
                  - img "Sneaker High Top Noir Intense" [ref=e604]
                  - generic [ref=e605]:
                    - heading "Sneaker High Top Noir Intense" [level=4] [ref=e606]
                    - generic [ref=e607]: basket pour homme
                  - generic [ref=e608]: 25,000 FCFA
            - generic [ref=e609]:
              - generic [ref=e610]:
                - generic [ref=e611]: Total du Look
                - generic [ref=e612]: 71,500 FCFA
              - button "Recréer ce look" [ref=e613] [cursor=pointer]
        - generic [ref=e617]:
          - generic [ref=e618]:
            - 'img "Dripping In Gold (Look #21)" [ref=e619]'
            - generic [ref=e620]: Vioutou Outfit 🔥
          - generic [ref=e621]:
            - generic [ref=e622]:
              - 'heading "Dripping In Gold (Look #21)" [level=3] [ref=e623]'
              - paragraph [ref=e624]: "Pièces de cet outfit :"
              - generic [ref=e625]:
                - link "Basket Streetwear Classic Black & White Basket Streetwear Classic Black & White basket pour homme 22,000 FCFA" [ref=e626] [cursor=pointer]:
                  - /url: /produit/1
                  - img "Basket Streetwear Classic Black & White" [ref=e628]
                  - generic [ref=e629]:
                    - heading "Basket Streetwear Classic Black & White" [level=4] [ref=e630]
                    - generic [ref=e631]: basket pour homme
                  - generic [ref=e632]: 22,000 FCFA
                - link "Basket Urban Luxe Gold Basket Urban Luxe Gold basket pour homme 24,500 FCFA" [ref=e633] [cursor=pointer]:
                  - /url: /produit/2
                  - img "Basket Urban Luxe Gold" [ref=e635]
                  - generic [ref=e636]:
                    - heading "Basket Urban Luxe Gold" [level=4] [ref=e637]
                    - generic [ref=e638]: basket pour homme
                  - generic [ref=e639]: 24,500 FCFA
            - generic [ref=e640]:
              - generic [ref=e641]:
                - generic [ref=e642]: Total du Look
                - generic [ref=e643]: 46,500 FCFA
              - button "Recréer ce look" [ref=e644] [cursor=pointer]
        - generic [ref=e648]:
          - generic [ref=e649]:
            - 'img "Sunset Vibe Outfit (Look #22)" [ref=e650]'
            - generic [ref=e651]: Vioutou Outfit 🔥
          - generic [ref=e652]:
            - generic [ref=e653]:
              - 'heading "Sunset Vibe Outfit (Look #22)" [level=3] [ref=e654]'
              - paragraph [ref=e655]: "Pièces de cet outfit :"
              - generic [ref=e656]:
                - link "Runner Sport Premium White Runner Sport Premium White basket pour homme 19,500 FCFA" [ref=e657] [cursor=pointer]:
                  - /url: /produit/3
                  - img "Runner Sport Premium White" [ref=e659]
                  - generic [ref=e660]:
                    - heading "Runner Sport Premium White" [level=4] [ref=e661]
                    - generic [ref=e662]: basket pour homme
                  - generic [ref=e663]: 19,500 FCFA
                - link "Basket Urban Luxe Gold Basket Urban Luxe Gold basket pour homme 24,500 FCFA" [ref=e664] [cursor=pointer]:
                  - /url: /produit/2
                  - img "Basket Urban Luxe Gold" [ref=e666]
                  - generic [ref=e667]:
                    - heading "Basket Urban Luxe Gold" [level=4] [ref=e668]
                    - generic [ref=e669]: basket pour homme
                  - generic [ref=e670]: 24,500 FCFA
                - link "Sneaker High Top Noir Intense Sneaker High Top Noir Intense basket pour homme 25,000 FCFA" [ref=e671] [cursor=pointer]:
                  - /url: /produit/4
                  - img "Sneaker High Top Noir Intense" [ref=e673]
                  - generic [ref=e674]:
                    - heading "Sneaker High Top Noir Intense" [level=4] [ref=e675]
                    - generic [ref=e676]: basket pour homme
                  - generic [ref=e677]: 25,000 FCFA
            - generic [ref=e678]:
              - generic [ref=e679]:
                - generic [ref=e680]: Total du Look
                - generic [ref=e681]: 69,000 FCFA
              - button "Recréer ce look" [ref=e682] [cursor=pointer]
        - generic [ref=e686]:
          - generic [ref=e687]:
            - 'img "Gold Accented King (Look #9)" [ref=e688]'
            - generic [ref=e689]: Vioutou Outfit 🔥
          - generic [ref=e690]:
            - generic [ref=e691]:
              - 'heading "Gold Accented King (Look #9)" [level=3] [ref=e692]'
              - paragraph [ref=e693]: "Pièces de cet outfit :"
              - generic [ref=e694]:
                - link "Basket Streetwear Classic Black & White Basket Streetwear Classic Black & White basket pour homme 22,000 FCFA" [ref=e695] [cursor=pointer]:
                  - /url: /produit/1
                  - img "Basket Streetwear Classic Black & White" [ref=e697]
                  - generic [ref=e698]:
                    - heading "Basket Streetwear Classic Black & White" [level=4] [ref=e699]
                    - generic [ref=e700]: basket pour homme
                  - generic [ref=e701]: 22,000 FCFA
                - link "Basket Urban Luxe Gold Basket Urban Luxe Gold basket pour homme 24,500 FCFA" [ref=e702] [cursor=pointer]:
                  - /url: /produit/2
                  - img "Basket Urban Luxe Gold" [ref=e704]
                  - generic [ref=e705]:
                    - heading "Basket Urban Luxe Gold" [level=4] [ref=e706]
                    - generic [ref=e707]: basket pour homme
                  - generic [ref=e708]: 24,500 FCFA
                - link "Jean Cargo Multi-Pockets Khaki Jean Cargo Multi-Pockets Khaki jean overside pour homme 20,500 FCFA" [ref=e709] [cursor=pointer]:
                  - /url: /produit/15
                  - img "Jean Cargo Multi-Pockets Khaki" [ref=e711]
                  - generic [ref=e712]:
                    - heading "Jean Cargo Multi-Pockets Khaki" [level=4] [ref=e713]
                    - generic [ref=e714]: jean overside pour homme
                  - generic [ref=e715]: 20,500 FCFA
            - generic [ref=e716]:
              - generic [ref=e717]:
                - generic [ref=e718]: Total du Look
                - generic [ref=e719]: 67,000 FCFA
              - button "Recréer ce look" [ref=e720] [cursor=pointer]
        - generic [ref=e724]:
          - generic [ref=e725]:
            - 'img "Modern Safari (Look #15)" [ref=e726]'
            - generic [ref=e727]: Vioutou Outfit 🔥
          - generic [ref=e728]:
            - generic [ref=e729]:
              - 'heading "Modern Safari (Look #15)" [level=3] [ref=e730]'
              - paragraph [ref=e731]: "Pièces de cet outfit :"
              - generic [ref=e732]:
                - link "Retro Trainer Multi-Color Retro Trainer Multi-Color basket pour homme 18,000 FCFA" [ref=e733] [cursor=pointer]:
                  - /url: /produit/5
                  - img "Retro Trainer Multi-Color" [ref=e735]
                  - generic [ref=e736]:
                    - heading "Retro Trainer Multi-Color" [level=4] [ref=e737]
                    - generic [ref=e738]: basket pour homme
                  - generic [ref=e739]: 18,000 FCFA
                - link "Runner Sport Premium White Runner Sport Premium White basket pour homme 19,500 FCFA" [ref=e740] [cursor=pointer]:
                  - /url: /produit/3
                  - img "Runner Sport Premium White" [ref=e742]
                  - generic [ref=e743]:
                    - heading "Runner Sport Premium White" [level=4] [ref=e744]
                    - generic [ref=e745]: basket pour homme
                  - generic [ref=e746]: 19,500 FCFA
                - link "Basket Streetwear Classic Black & White Basket Streetwear Classic Black & White basket pour homme 22,000 FCFA" [ref=e747] [cursor=pointer]:
                  - /url: /produit/1
                  - img "Basket Streetwear Classic Black & White" [ref=e749]
                  - generic [ref=e750]:
                    - heading "Basket Streetwear Classic Black & White" [level=4] [ref=e751]
                    - generic [ref=e752]: basket pour homme
                  - generic [ref=e753]: 22,000 FCFA
            - generic [ref=e754]:
              - generic [ref=e755]:
                - generic [ref=e756]: Total du Look
                - generic [ref=e757]: 59,500 FCFA
              - button "Recréer ce look" [ref=e758] [cursor=pointer]
        - generic [ref=e762]:
          - generic [ref=e763]:
            - 'img "Dapper Street Boy (Look #16)" [ref=e764]'
            - generic [ref=e765]: Vioutou Outfit 🔥
          - generic [ref=e766]:
            - generic [ref=e767]:
              - 'heading "Dapper Street Boy (Look #16)" [level=3] [ref=e768]'
              - paragraph [ref=e769]: "Pièces de cet outfit :"
              - generic [ref=e770]:
                - link "Basket Urban Luxe Gold Basket Urban Luxe Gold basket pour homme 24,500 FCFA" [ref=e771] [cursor=pointer]:
                  - /url: /produit/2
                  - img "Basket Urban Luxe Gold" [ref=e773]
                  - generic [ref=e774]:
                    - heading "Basket Urban Luxe Gold" [level=4] [ref=e775]
                    - generic [ref=e776]: basket pour homme
                  - generic [ref=e777]: 24,500 FCFA
                - link "Basket Streetwear Classic Black & White Basket Streetwear Classic Black & White basket pour homme 22,000 FCFA" [ref=e778] [cursor=pointer]:
                  - /url: /produit/1
                  - img "Basket Streetwear Classic Black & White" [ref=e780]
                  - generic [ref=e781]:
                    - heading "Basket Streetwear Classic Black & White" [level=4] [ref=e782]
                    - generic [ref=e783]: basket pour homme
                  - generic [ref=e784]: 22,000 FCFA
                - link "Sneaker High Top Noir Intense Sneaker High Top Noir Intense basket pour homme 25,000 FCFA" [ref=e785] [cursor=pointer]:
                  - /url: /produit/4
                  - img "Sneaker High Top Noir Intense" [ref=e787]
                  - generic [ref=e788]:
                    - heading "Sneaker High Top Noir Intense" [level=4] [ref=e789]
                    - generic [ref=e790]: basket pour homme
                  - generic [ref=e791]: 25,000 FCFA
            - generic [ref=e792]:
              - generic [ref=e793]:
                - generic [ref=e794]: Total du Look
                - generic [ref=e795]: 71,500 FCFA
              - button "Recréer ce look" [ref=e796] [cursor=pointer]
        - generic [ref=e800]:
          - generic [ref=e801]:
            - 'img "Classic HP Drip (Look #10)" [ref=e802]'
            - generic [ref=e803]: Vioutou Outfit 🔥
          - generic [ref=e804]:
            - generic [ref=e805]:
              - 'heading "Classic HP Drip (Look #10)" [level=3] [ref=e806]'
              - paragraph [ref=e807]: "Pièces de cet outfit :"
              - generic [ref=e808]:
                - link "Runner Sport Premium White Runner Sport Premium White basket pour homme 19,500 FCFA" [ref=e809] [cursor=pointer]:
                  - /url: /produit/3
                  - img "Runner Sport Premium White" [ref=e811]
                  - generic [ref=e812]:
                    - heading "Runner Sport Premium White" [level=4] [ref=e813]
                    - generic [ref=e814]: basket pour homme
                  - generic [ref=e815]: 19,500 FCFA
                - link "Basket Urban Luxe Gold Basket Urban Luxe Gold basket pour homme 24,500 FCFA" [ref=e816] [cursor=pointer]:
                  - /url: /produit/2
                  - img "Basket Urban Luxe Gold" [ref=e818]
                  - generic [ref=e819]:
                    - heading "Basket Urban Luxe Gold" [level=4] [ref=e820]
                    - generic [ref=e821]: basket pour homme
                  - generic [ref=e822]: 24,500 FCFA
                - link "Sneaker High Top Noir Intense Sneaker High Top Noir Intense basket pour homme 25,000 FCFA" [ref=e823] [cursor=pointer]:
                  - /url: /produit/4
                  - img "Sneaker High Top Noir Intense" [ref=e825]
                  - generic [ref=e826]:
                    - heading "Sneaker High Top Noir Intense" [level=4] [ref=e827]
                    - generic [ref=e828]: basket pour homme
                  - generic [ref=e829]: 25,000 FCFA
            - generic [ref=e830]:
              - generic [ref=e831]:
                - generic [ref=e832]: Total du Look
                - generic [ref=e833]: 69,000 FCFA
              - button "Recréer ce look" [ref=e834] [cursor=pointer]
        - generic [ref=e838]:
          - generic [ref=e839]:
            - 'img "Urban Royalty (Look #1)" [ref=e840]'
            - generic [ref=e841]: Vioutou Outfit 🔥
          - generic [ref=e842]:
            - generic [ref=e843]:
              - 'heading "Urban Royalty (Look #1)" [level=3] [ref=e844]'
              - paragraph [ref=e845]: "Pièces de cet outfit :"
              - generic [ref=e846]:
                - link "Basket Streetwear Classic Black & White Basket Streetwear Classic Black & White basket pour homme 22,000 FCFA" [ref=e847] [cursor=pointer]:
                  - /url: /produit/1
                  - img "Basket Streetwear Classic Black & White" [ref=e849]
                  - generic [ref=e850]:
                    - heading "Basket Streetwear Classic Black & White" [level=4] [ref=e851]
                    - generic [ref=e852]: basket pour homme
                  - generic [ref=e853]: 22,000 FCFA
                - link "Basket Urban Luxe Gold Basket Urban Luxe Gold basket pour homme 24,500 FCFA" [ref=e854] [cursor=pointer]:
                  - /url: /produit/2
                  - img "Basket Urban Luxe Gold" [ref=e856]
                  - generic [ref=e857]:
                    - heading "Basket Urban Luxe Gold" [level=4] [ref=e858]
                    - generic [ref=e859]: basket pour homme
                  - generic [ref=e860]: 24,500 FCFA
            - generic [ref=e861]:
              - generic [ref=e862]:
                - generic [ref=e863]: Total du Look
                - generic [ref=e864]: 46,500 FCFA
              - button "Recréer ce look" [ref=e865] [cursor=pointer]
        - generic [ref=e869]:
          - generic [ref=e870]:
            - 'img "Denim Deluxe (Look #2)" [ref=e871]'
            - generic [ref=e872]: Vioutou Outfit 🔥
          - generic [ref=e873]:
            - generic [ref=e874]:
              - 'heading "Denim Deluxe (Look #2)" [level=3] [ref=e875]'
              - paragraph [ref=e876]: "Pièces de cet outfit :"
              - generic [ref=e877]:
                - link "Runner Sport Premium White Runner Sport Premium White basket pour homme 19,500 FCFA" [ref=e878] [cursor=pointer]:
                  - /url: /produit/3
                  - img "Runner Sport Premium White" [ref=e880]
                  - generic [ref=e881]:
                    - heading "Runner Sport Premium White" [level=4] [ref=e882]
                    - generic [ref=e883]: basket pour homme
                  - generic [ref=e884]: 19,500 FCFA
                - link "Basket Urban Luxe Gold Basket Urban Luxe Gold basket pour homme 24,500 FCFA" [ref=e885] [cursor=pointer]:
                  - /url: /produit/2
                  - img "Basket Urban Luxe Gold" [ref=e887]
                  - generic [ref=e888]:
                    - heading "Basket Urban Luxe Gold" [level=4] [ref=e889]
                    - generic [ref=e890]: basket pour homme
                  - generic [ref=e891]: 24,500 FCFA
                - link "Sneaker High Top Noir Intense Sneaker High Top Noir Intense basket pour homme 25,000 FCFA" [ref=e892] [cursor=pointer]:
                  - /url: /produit/4
                  - img "Sneaker High Top Noir Intense" [ref=e894]
                  - generic [ref=e895]:
                    - heading "Sneaker High Top Noir Intense" [level=4] [ref=e896]
                    - generic [ref=e897]: basket pour homme
                  - generic [ref=e898]: 25,000 FCFA
            - generic [ref=e899]:
              - generic [ref=e900]:
                - generic [ref=e901]: Total du Look
                - generic [ref=e902]: 69,000 FCFA
              - button "Recréer ce look" [ref=e903] [cursor=pointer]
        - generic [ref=e907]:
          - generic [ref=e908]:
            - 'img "Luxe Streetwear (Look #3)" [ref=e909]'
            - generic [ref=e910]: Vioutou Outfit 🔥
          - generic [ref=e911]:
            - generic [ref=e912]:
              - 'heading "Luxe Streetwear (Look #3)" [level=3] [ref=e913]'
              - paragraph [ref=e914]: "Pièces de cet outfit :"
              - generic [ref=e915]:
                - link "Retro Trainer Multi-Color Retro Trainer Multi-Color basket pour homme 18,000 FCFA" [ref=e916] [cursor=pointer]:
                  - /url: /produit/5
                  - img "Retro Trainer Multi-Color" [ref=e918]
                  - generic [ref=e919]:
                    - heading "Retro Trainer Multi-Color" [level=4] [ref=e920]
                    - generic [ref=e921]: basket pour homme
                  - generic [ref=e922]: 18,000 FCFA
                - link "Runner Sport Premium White Runner Sport Premium White basket pour homme 19,500 FCFA" [ref=e923] [cursor=pointer]:
                  - /url: /produit/3
                  - img "Runner Sport Premium White" [ref=e925]
                  - generic [ref=e926]:
                    - heading "Runner Sport Premium White" [level=4] [ref=e927]
                    - generic [ref=e928]: basket pour homme
                  - generic [ref=e929]: 19,500 FCFA
                - link "Basket Streetwear Classic Black & White Basket Streetwear Classic Black & White basket pour homme 22,000 FCFA" [ref=e930] [cursor=pointer]:
                  - /url: /produit/1
                  - img "Basket Streetwear Classic Black & White" [ref=e932]
                  - generic [ref=e933]:
                    - heading "Basket Streetwear Classic Black & White" [level=4] [ref=e934]
                    - generic [ref=e935]: basket pour homme
                  - generic [ref=e936]: 22,000 FCFA
            - generic [ref=e937]:
              - generic [ref=e938]:
                - generic [ref=e939]: Total du Look
                - generic [ref=e940]: 59,500 FCFA
              - button "Recréer ce look" [ref=e941] [cursor=pointer]
        - generic [ref=e945]:
          - generic [ref=e946]:
            - 'img "Minimalist Vibe (Look #4)" [ref=e947]'
            - generic [ref=e948]: Vioutou Outfit 🔥
          - generic [ref=e949]:
            - generic [ref=e950]:
              - 'heading "Minimalist Vibe (Look #4)" [level=3] [ref=e951]'
              - paragraph [ref=e952]: "Pièces de cet outfit :"
              - generic [ref=e953]:
                - link "Basket Urban Luxe Gold Basket Urban Luxe Gold basket pour homme 24,500 FCFA" [ref=e954] [cursor=pointer]:
                  - /url: /produit/2
                  - img "Basket Urban Luxe Gold" [ref=e956]
                  - generic [ref=e957]:
                    - heading "Basket Urban Luxe Gold" [level=4] [ref=e958]
                    - generic [ref=e959]: basket pour homme
                  - generic [ref=e960]: 24,500 FCFA
                - link "Basket Streetwear Classic Black & White Basket Streetwear Classic Black & White basket pour homme 22,000 FCFA" [ref=e961] [cursor=pointer]:
                  - /url: /produit/1
                  - img "Basket Streetwear Classic Black & White" [ref=e963]
                  - generic [ref=e964]:
                    - heading "Basket Streetwear Classic Black & White" [level=4] [ref=e965]
                    - generic [ref=e966]: basket pour homme
                  - generic [ref=e967]: 22,000 FCFA
                - link "Sneaker High Top Noir Intense Sneaker High Top Noir Intense basket pour homme 25,000 FCFA" [ref=e968] [cursor=pointer]:
                  - /url: /produit/4
                  - img "Sneaker High Top Noir Intense" [ref=e970]
                  - generic [ref=e971]:
                    - heading "Sneaker High Top Noir Intense" [level=4] [ref=e972]
                    - generic [ref=e973]: basket pour homme
                  - generic [ref=e974]: 25,000 FCFA
            - generic [ref=e975]:
              - generic [ref=e976]:
                - generic [ref=e977]: Total du Look
                - generic [ref=e978]: 71,500 FCFA
              - button "Recréer ce look" [ref=e979] [cursor=pointer]
        - generic [ref=e983]:
          - generic [ref=e984]:
            - 'img "Margiela Flow (Look #5)" [ref=e985]'
            - generic [ref=e986]: Vioutou Outfit 🔥
          - generic [ref=e987]:
            - generic [ref=e988]:
              - 'heading "Margiela Flow (Look #5)" [level=3] [ref=e989]'
              - paragraph [ref=e990]: "Pièces de cet outfit :"
              - generic [ref=e991]:
                - link "Basket Streetwear Classic Black & White Basket Streetwear Classic Black & White basket pour homme 22,000 FCFA" [ref=e992] [cursor=pointer]:
                  - /url: /produit/1
                  - img "Basket Streetwear Classic Black & White" [ref=e994]
                  - generic [ref=e995]:
                    - heading "Basket Streetwear Classic Black & White" [level=4] [ref=e996]
                    - generic [ref=e997]: basket pour homme
                  - generic [ref=e998]: 22,000 FCFA
                - link "Basket Urban Luxe Gold Basket Urban Luxe Gold basket pour homme 24,500 FCFA" [ref=e999] [cursor=pointer]:
                  - /url: /produit/2
                  - img "Basket Urban Luxe Gold" [ref=e1001]
                  - generic [ref=e1002]:
                    - heading "Basket Urban Luxe Gold" [level=4] [ref=e1003]
                    - generic [ref=e1004]: basket pour homme
                  - generic [ref=e1005]: 24,500 FCFA
            - generic [ref=e1006]:
              - generic [ref=e1007]:
                - generic [ref=e1008]: Total du Look
                - generic [ref=e1009]: 46,500 FCFA
              - button "Recréer ce look" [ref=e1010] [cursor=pointer]
        - generic [ref=e1014]:
          - generic [ref=e1015]:
            - 'img "Cozy Street Wear (Look #6)" [ref=e1016]'
            - generic [ref=e1017]: Vioutou Outfit 🔥
          - generic [ref=e1018]:
            - generic [ref=e1019]:
              - 'heading "Cozy Street Wear (Look #6)" [level=3] [ref=e1020]'
              - paragraph [ref=e1021]: "Pièces de cet outfit :"
              - generic [ref=e1022]:
                - link "Runner Sport Premium White Runner Sport Premium White basket pour homme 19,500 FCFA" [ref=e1023] [cursor=pointer]:
                  - /url: /produit/3
                  - img "Runner Sport Premium White" [ref=e1025]
                  - generic [ref=e1026]:
                    - heading "Runner Sport Premium White" [level=4] [ref=e1027]
                    - generic [ref=e1028]: basket pour homme
                  - generic [ref=e1029]: 19,500 FCFA
                - link "Basket Urban Luxe Gold Basket Urban Luxe Gold basket pour homme 24,500 FCFA" [ref=e1030] [cursor=pointer]:
                  - /url: /produit/2
                  - img "Basket Urban Luxe Gold" [ref=e1032]
                  - generic [ref=e1033]:
                    - heading "Basket Urban Luxe Gold" [level=4] [ref=e1034]
                    - generic [ref=e1035]: basket pour homme
                  - generic [ref=e1036]: 24,500 FCFA
                - link "Sneaker High Top Noir Intense Sneaker High Top Noir Intense basket pour homme 25,000 FCFA" [ref=e1037] [cursor=pointer]:
                  - /url: /produit/4
                  - img "Sneaker High Top Noir Intense" [ref=e1039]
                  - generic [ref=e1040]:
                    - heading "Sneaker High Top Noir Intense" [level=4] [ref=e1041]
                    - generic [ref=e1042]: basket pour homme
                  - generic [ref=e1043]: 25,000 FCFA
            - generic [ref=e1044]:
              - generic [ref=e1045]:
                - generic [ref=e1046]: Total du Look
                - generic [ref=e1047]: 69,000 FCFA
              - button "Recréer ce look" [ref=e1048] [cursor=pointer]
        - generic [ref=e1052]:
          - generic [ref=e1053]:
            - 'img "Sport Runner Elite (Look #7)" [ref=e1054]'
            - generic [ref=e1055]: Vioutou Outfit 🔥
          - generic [ref=e1056]:
            - generic [ref=e1057]:
              - 'heading "Sport Runner Elite (Look #7)" [level=3] [ref=e1058]'
              - paragraph [ref=e1059]: "Pièces de cet outfit :"
              - generic [ref=e1060]:
                - link "Retro Trainer Multi-Color Retro Trainer Multi-Color basket pour homme 18,000 FCFA" [ref=e1061] [cursor=pointer]:
                  - /url: /produit/5
                  - img "Retro Trainer Multi-Color" [ref=e1063]
                  - generic [ref=e1064]:
                    - heading "Retro Trainer Multi-Color" [level=4] [ref=e1065]
                    - generic [ref=e1066]: basket pour homme
                  - generic [ref=e1067]: 18,000 FCFA
                - link "Runner Sport Premium White Runner Sport Premium White basket pour homme 19,500 FCFA" [ref=e1068] [cursor=pointer]:
                  - /url: /produit/3
                  - img "Runner Sport Premium White" [ref=e1070]
                  - generic [ref=e1071]:
                    - heading "Runner Sport Premium White" [level=4] [ref=e1072]
                    - generic [ref=e1073]: basket pour homme
                  - generic [ref=e1074]: 19,500 FCFA
                - link "Basket Streetwear Classic Black & White Basket Streetwear Classic Black & White basket pour homme 22,000 FCFA" [ref=e1075] [cursor=pointer]:
                  - /url: /produit/1
                  - img "Basket Streetwear Classic Black & White" [ref=e1077]
                  - generic [ref=e1078]:
                    - heading "Basket Streetwear Classic Black & White" [level=4] [ref=e1079]
                    - generic [ref=e1080]: basket pour homme
                  - generic [ref=e1081]: 22,000 FCFA
            - generic [ref=e1082]:
              - generic [ref=e1083]:
                - generic [ref=e1084]: Total du Look
                - generic [ref=e1085]: 59,500 FCFA
              - button "Recréer ce look" [ref=e1086] [cursor=pointer]
        - generic [ref=e1090]:
          - generic [ref=e1091]:
            - 'img "Oversized Monogram (Look #12)" [ref=e1092]'
            - generic [ref=e1093]: Vioutou Outfit 🔥
          - generic [ref=e1094]:
            - generic [ref=e1095]:
              - 'heading "Oversized Monogram (Look #12)" [level=3] [ref=e1096]'
              - paragraph [ref=e1097]: "Pièces de cet outfit :"
              - generic [ref=e1098]:
                - link "Basket Urban Luxe Gold Basket Urban Luxe Gold basket pour homme 24,500 FCFA" [ref=e1099] [cursor=pointer]:
                  - /url: /produit/2
                  - img "Basket Urban Luxe Gold" [ref=e1101]
                  - generic [ref=e1102]:
                    - heading "Basket Urban Luxe Gold" [level=4] [ref=e1103]
                    - generic [ref=e1104]: basket pour homme
                  - generic [ref=e1105]: 24,500 FCFA
                - link "Basket Streetwear Classic Black & White Basket Streetwear Classic Black & White basket pour homme 22,000 FCFA" [ref=e1106] [cursor=pointer]:
                  - /url: /produit/1
                  - img "Basket Streetwear Classic Black & White" [ref=e1108]
                  - generic [ref=e1109]:
                    - heading "Basket Streetwear Classic Black & White" [level=4] [ref=e1110]
                    - generic [ref=e1111]: basket pour homme
                  - generic [ref=e1112]: 22,000 FCFA
                - link "Sneaker High Top Noir Intense Sneaker High Top Noir Intense basket pour homme 25,000 FCFA" [ref=e1113] [cursor=pointer]:
                  - /url: /produit/4
                  - img "Sneaker High Top Noir Intense" [ref=e1115]
                  - generic [ref=e1116]:
                    - heading "Sneaker High Top Noir Intense" [level=4] [ref=e1117]
                    - generic [ref=e1118]: basket pour homme
                  - generic [ref=e1119]: 25,000 FCFA
            - generic [ref=e1120]:
              - generic [ref=e1121]:
                - generic [ref=e1122]: Total du Look
                - generic [ref=e1123]: 71,500 FCFA
              - button "Recréer ce look" [ref=e1124] [cursor=pointer]
        - generic [ref=e1128]:
          - generic [ref=e1129]:
            - 'img "Benin Trendsetter (Look #8)" [ref=e1130]'
            - generic [ref=e1131]: Vioutou Outfit 🔥
          - generic [ref=e1132]:
            - generic [ref=e1133]:
              - 'heading "Benin Trendsetter (Look #8)" [level=3] [ref=e1134]'
              - paragraph [ref=e1135]: "Pièces de cet outfit :"
              - generic [ref=e1136]:
                - link "Basket Urban Luxe Gold Basket Urban Luxe Gold basket pour homme 24,500 FCFA" [ref=e1137] [cursor=pointer]:
                  - /url: /produit/2
                  - img "Basket Urban Luxe Gold" [ref=e1139]
                  - generic [ref=e1140]:
                    - heading "Basket Urban Luxe Gold" [level=4] [ref=e1141]
                    - generic [ref=e1142]: basket pour homme
                  - generic [ref=e1143]: 24,500 FCFA
                - link "Basket Streetwear Classic Black & White Basket Streetwear Classic Black & White basket pour homme 22,000 FCFA" [ref=e1144] [cursor=pointer]:
                  - /url: /produit/1
                  - img "Basket Streetwear Classic Black & White" [ref=e1146]
                  - generic [ref=e1147]:
                    - heading "Basket Streetwear Classic Black & White" [level=4] [ref=e1148]
                    - generic [ref=e1149]: basket pour homme
                  - generic [ref=e1150]: 22,000 FCFA
                - link "Sneaker High Top Noir Intense Sneaker High Top Noir Intense basket pour homme 25,000 FCFA" [ref=e1151] [cursor=pointer]:
                  - /url: /produit/4
                  - img "Sneaker High Top Noir Intense" [ref=e1153]
                  - generic [ref=e1154]:
                    - heading "Sneaker High Top Noir Intense" [level=4] [ref=e1155]
                    - generic [ref=e1156]: basket pour homme
                  - generic [ref=e1157]: 25,000 FCFA
            - generic [ref=e1158]:
              - generic [ref=e1159]:
                - generic [ref=e1160]: Total du Look
                - generic [ref=e1161]: 71,500 FCFA
              - button "Recréer ce look" [ref=e1162] [cursor=pointer]
    - generic [ref=e1166]:
      - generic [ref=e1167]:
        - generic [ref=e1168]:
          - link [ref=e1169] [cursor=pointer]:
            - /url: /
            - img "HP Collection Logo" [ref=e1170]
          - paragraph [ref=e1171]: Vioutou t'habille. Tu règnes.
          - paragraph [ref=e1172]: La marque de mode streetwear premium au Bénin. Statut, style, modernité et une élégance sans compromis.
        - generic [ref=e1173]:
          - heading "Catégories" [level=3] [ref=e1174]
          - list [ref=e1175]:
            - listitem [ref=e1176]:
              - link "Baskets pour Homme" [ref=e1177] [cursor=pointer]:
                - /url: /categorie/basket-pour-homme
            - listitem [ref=e1178]:
              - link "Complets Streetwear" [ref=e1179] [cursor=pointer]:
                - /url: /categorie/complet-pour-homme
            - listitem [ref=e1180]:
              - link "Jeans Oversize" [ref=e1181] [cursor=pointer]:
                - /url: /categorie/jean-overside-pour-homme
            - listitem [ref=e1182]:
              - link "Claquettes & Sandales" [ref=e1183] [cursor=pointer]:
                - /url: /categorie/tapettes-pour-homme
        - generic [ref=e1184]:
          - heading "Découvrir" [level=3] [ref=e1185]
          - list [ref=e1186]:
            - listitem [ref=e1187]:
              - link "Looks de Vioutou" [ref=e1188] [cursor=pointer]:
                - /url: /looks
            - listitem [ref=e1189]:
              - link "Avis Clients" [ref=e1190] [cursor=pointer]:
                - /url: /#testimonials
            - listitem [ref=e1191]:
              - link "Foire Aux Questions" [ref=e1192] [cursor=pointer]:
                - /url: /#faq
        - generic [ref=e1193]:
          - heading "Boutique" [level=3] [ref=e1194]
          - paragraph [ref=e1195]:
            - generic [ref=e1196]: Bénin
            - generic [ref=e1203]: Livraison 24h/48h dans tout le pays.
            - generic [ref=e1207]: 💬 Commandes instantanées via WhatsApp.
          - link "Discuter sur WhatsApp" [ref=e1208] [cursor=pointer]:
            - /url: https://wa.me/22967280018
      - generic [ref=e1209]:
        - paragraph [ref=e1210]: © 2026 HP Collection. Tous droits réservés.
        - paragraph [ref=e1211]: Créé pour Vioutou | Mode Streetwear Premium Bénin 🇧🇯
    - link "Deal avec Vioutou" [ref=e1212] [cursor=pointer]:
      - /url: https://wa.me/22967280018?text=Bonjour%20Vioutou%20!%20Je%20viens%20du%20site%20HP%20Collection%20et%20j'aimerais%20discuter%20de%20vos%20outfits.
  - alert [ref=e1215]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | // Phase finale 09/2026 (E1) — HP inspection, parcours RÉELS :
  4   | // /looks = cartes inline (pièces listées + liens) ; home = carrousel -> LookModal.
  5   | // Données du build sans env : looks statiques AVEC pièces reliées (ex. Look #1
  6   | // -> produit 6) ; l'état « sans pièces » est couvert par les gardes unitaires.
  7   | 
  8   | test.describe('E1 — HP inspection (page /looks)', () => {
  9   |   test('une carte HP liste ses pièces avec liens vers les fiches produit', async ({ page }) => {
  10  |     await page.goto('/looks');
  11  |     const piece = page.locator('a[href^="/produit/"]').first();
  12  |     await expect(piece).toBeVisible({ timeout: 20000 });
  13  |     await expect(page.getByText('Pièces de cet outfit :').first()).toBeVisible();
  14  |   });
  15  | 
  16  |   test('clic sur une pièce -> la fiche produit s’ouvre (inspection réelle)', async ({ page }) => {
  17  |     await page.goto('/looks');
  18  |     const piece = page.locator('a[href^="/produit/"]').first();
  19  |     await piece.waitFor({ state: 'visible', timeout: 20000 });
  20  |     await piece.click();
> 21  |     await page.waitForURL(/\/produit\//, { timeout: 15000 });
      |                ^ TimeoutError: page.waitForURL: Timeout 15000ms exceeded.
  22  |     expect(page.url()).toContain('/produit/');
  23  |   });
  24  | 
  25  |   test('chaque carte garde une issue WhatsApp (« Recréer ce look »)', async ({ page }) => {
  26  |     await page.goto('/looks');
  27  |     const recreer = page.getByRole('button', { name: /Recréer ce look/i }).first();
  28  |     await expect(recreer).toBeVisible({ timeout: 20000 });
  29  |   });
  30  | });
  31  | 
  32  | test.describe('E1 — HP inspection (carrousel home -> LookModal)', () => {
  33  |   test('clic souris sur un HP du carrousel ouvre la modale d’inspection', async ({ page }) => {
  34  |     await page.goto('/');
  35  |     // viser directement la section carrousel (les vignettes d'intro portent
  36  |     // des alts « Look #N » identiques mais ne sont pas cliquables)
  37  |     const section = page.locator('#carousel-outfits');
  38  |     await section.waitFor({ state: 'attached', timeout: 20000 });
  39  |     await section.scrollIntoViewIfNeeded();
  40  |     await page.waitForTimeout(1200);
  41  |     // Cibler une carte dont le centre est DANS le viewport : en production,
  42  |     // l'hydratation est immédiate et l'auto-scroll (80 px/s) déplace déjà la
  43  |     // première carte hors écran pendant les délais d'attente — cliquer son
  44  |     // centre historique partirait à côté du viewport (clic dans le vide).
  45  |     const cartes = section.locator('img[alt*="Look #"]');
  46  |     const nbCartes = await cartes.count();
  47  |     const vw = page.viewportSize()?.width ?? 1280;
  48  |     const vh = page.viewportSize()?.height ?? 900;
  49  |     let box0: { x: number; y: number; width: number; height: number } | null = null;
  50  |     for (let i = 0; i < nbCartes; i += 1) {
  51  |       const bx = await cartes.nth(i).boundingBox().catch(() => null);
  52  |       if (bx && bx.x + bx.width / 2 >= 24 && bx.x + bx.width / 2 <= vw - 24 && bx.y + bx.height / 2 >= 24 && bx.y + bx.height / 2 <= vh - 24) {
  53  |         box0 = bx;
  54  |         break;
  55  |       }
  56  |     }
  57  |     if (!box0) throw new Error('aucune carte cliquable dans le viewport');
  58  |     // le survol met l'auto-scroll en pause (onMouseEnter du track) : la piste
  59  |     // devient alors stable. NB: locator.hover() vérifie la stabilité AVANT de
  60  |     // bouger la souris (impasse) — déplacement manuel comme un visiteur.
  61  |     // C'est précisément le parcours que la capture de pointeur au pointerdown
  62  |     // rendait impossible avant le correctif E1.
  63  |     await page.mouse.move(box0.x + box0.width / 2, box0.y + box0.height / 2);
  64  |     await page.waitForTimeout(1000);
  65  |     // clic 100 % souris au centre recalculé après pause de l'auto-scroll :
  66  |     // mousedown/pointerdown réels sur la carte, comme un visiteur.
  67  |     const apresPause = await page.evaluate(([cx, cy]) => { const el = document.elementFromPoint(cx, cy); return el ? el.getAttribute('alt') || el.tagName : null; }, [box0.x + box0.width / 2, box0.y + box0.height / 2]);
  68  |     if (!apresPause || !String(apresPause).includes('Look #')) {
  69  |       // la carte a dérivé avant la pause : on recentre une fois sur l'élément
  70  |       // réellement présent sous le curseur (la piste est en pause depuis le hover).
  71  |       const sousCurseur = await page.evaluate(() => {
  72  |         const imgs = Array.from(document.querySelectorAll('#carousel-outfits img'));
  73  |         for (const img of imgs) {
  74  |           const r = img.getBoundingClientRect();
  75  |           if (r.x + r.width / 2 >= 24 && r.x + r.width / 2 <= window.innerWidth - 24) return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  76  |         }
  77  |         return null;
  78  |       });
  79  |       if (sousCurseur) await page.mouse.move(sousCurseur.x, sousCurseur.y);
  80  |       await page.waitForTimeout(400);
  81  |     }
  82  |     const finale = await page.evaluate(() => {
  83  |       const imgs = Array.from(document.querySelectorAll('#carousel-outfits img'));
  84  |       for (const img of imgs) {
  85  |         const r = img.getBoundingClientRect();
  86  |         if (r.x + r.width / 2 >= 24 && r.x + r.width / 2 <= window.innerWidth - 24 && r.y + r.height / 2 >= 24 && r.y + r.height / 2 <= window.innerHeight - 24) {
  87  |           return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  88  |         }
  89  |       }
  90  |       return null;
  91  |     });
  92  |     if (!finale) throw new Error('aucune carte cliquable après pause');
  93  |     await page.mouse.click(finale.x, finale.y);
  94  |     const dialog = page.locator('[role="dialog"]').first();
  95  |     await expect(dialog).toBeVisible({ timeout: 10000 });
  96  |     // LookModal : « Cet outfit est composé de pièces… » (pièces reliées) ou
  97  |     // « Les pièces de ce look ne sont pas encore reliées… » (état vide E1).
  98  |     await expect(dialog).toContainText(/pièces/i);
  99  |     // inspection réelle : les pièces ouvrent leur fiche produit.
  100 |     await expect(dialog.locator('a[href^="/produit/"]').first()).toBeVisible();
  101 |   });
  102 | });
  103 | 
  104 | test.describe('E1 — drag-to-scroll préservé (non-régression capture)', () => {
  105 |   test('un drag horizontal fait défiler la piste sans ouvrir la modale', async ({ page }) => {
  106 |     await page.goto('/');
  107 |     const section = page.locator('#carousel-outfits');
  108 |     await section.waitFor({ state: 'attached', timeout: 20000 });
  109 |     await section.scrollIntoViewIfNeeded();
  110 |     await page.waitForTimeout(1200);
  111 |     const carte = section.locator('img[alt*="Look #"]').first();
  112 |     await carte.waitFor({ state: 'visible', timeout: 20000 });
  113 |     const box = await carte.boundingBox();
  114 |     if (!box) throw new Error('carte hors viewport');
  115 |     const track = section.locator('.outfit-carousel-track');
  116 |     const before = await track.evaluate((el) => el.scrollLeft);
  117 |     const cx = box.x + box.width / 2;
  118 |     const cy = box.y + box.height / 2;
  119 |     await page.mouse.move(cx, cy);
  120 |     await page.waitForTimeout(300);
  121 |     await page.mouse.down();
```