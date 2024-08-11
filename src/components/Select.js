export default `
<select id="{{id}}" class="select">
  {{#each options}}
    <option value="{{this}}">{{this}}</option>
  {{/each}}
</select>
`;